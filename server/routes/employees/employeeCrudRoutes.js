/**
 * server/routes/employees/employeeCrudRoutes.js
 * Endpoint CRUD profil karyawan (POST create/upsert, PUT update, DELETE).
 */

import { validate } from '../../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema } from '../../schemas/employeeSchemas.js';
import { sendWelcomeEmail } from '../../services/welcomeEmailService.js';
import { generateAutoNik, resolveUnitId, createOrRecoverAuthUser } from './employeeCreationHelper.js';

export const registerEmployeeCrudRoutes = (router, deps) => {
  const isProd = process.env.NODE_ENV === 'production';
  const {
    getRequesterContext,
    canManageEmployeesRole,
    canDeleteEmployeesRole,
    adminSupabase,
    logDetailedError,
    getClientErrorMessage,
    invalidateEmployeeCaches,
    normalizeEmployeeData,
    normalizeEmployeeUpdateData,
    loggingService,
  } = deps;

  // POST /
  router.post('/', validate(createEmployeeSchema), async (req, res) => {
    try {
      const context = await getRequesterContext(req);
      if (!context.ok) {
        return res.status(context.status).json({ success: false, error: context.error });
      }

      if (!canManageEmployeesRole(context.role)) {
        return res.status(403).json({ success: false, error: 'Hanya admin & HRD yang dapat membuat karyawan baru' });
      }

      const { employeeData, password, documents = [], updateExisting = false } = req.body || {};
      if (!employeeData || typeof employeeData !== 'object') {
        return res.status(400).json({ success: false, error: 'employeeData is required' });
      }

      // 1. Cek duplikasi NIK jika mode updateExisting aktif
      let existingEmployee = null;
      if (employeeData.nik && String(employeeData.nik).trim()) {
        const { data: foundEmp } = await context.dbClient
          .from('employees')
          .select('id, user_id, nama, email, nik')
          .eq('nik', employeeData.nik)
          .maybeSingle();
        existingEmployee = foundEmp;
      }

      if (existingEmployee && updateExisting) {
        const profilePayload = normalizeEmployeeData(employeeData);
        delete profilePayload.id;

        const emailToUse = String(employeeData.email || existingEmployee.email || '').trim();
        let currentUserId = existingEmployee.user_id;

        if (!currentUserId && emailToUse) {
          const authRes = await createOrRecoverAuthUser(adminSupabase, context.dbClient, emailToUse, employeeData.nama, password, loggingService);
          if (authRes.userId) {
            currentUserId = authRes.userId;
            profilePayload.user_id = authRes.userId;
          }
        }

        const profileClient = adminSupabase || context.dbClient;
        const { data: updatedEmployee, error: profileError } = await profileClient
          .from('employees')
          .update(profilePayload)
          .eq('id', existingEmployee.id)
          .select('*')
          .single();

        if (profileError || !updatedEmployee) {
          logDetailedError('Employee.upsert.profile', profileError, { employeeId: existingEmployee.id });
          return res.status(400).json({ success: false, error: 'Gagal memperbarui profil karyawan pada saat import.' });
        }

        if (Array.isArray(documents) && documents.length > 0) {
          const docsToInsert = documents.map((doc) => ({
            employeeId: updatedEmployee.id,
            name: doc?.name,
            type: doc?.type,
            fileUrl: doc?.fileUrl,
            uploadedAt: doc?.uploadedAt || new Date().toISOString(),
          }));
          await context.dbClient.from('documents').insert(docsToInsert);
        }

        await invalidateEmployeeCaches(updatedEmployee);
        return res.status(200).json({ success: true, data: updatedEmployee, isUpdated: true });
      }

      // 2. Insert Baru
      employeeData.nik = await generateAutoNik(context.dbClient, employeeData);
      employeeData.unitKerjaId = await resolveUnitId(context.dbClient, employeeData.unitKerjaId);

      // Cek duplikasi email
      if (employeeData.email && String(employeeData.email).trim()) {
        const { data: existingEmail } = await context.dbClient
          .from('employees')
          .select('id')
          .eq('email', employeeData.email)
          .maybeSingle();

        if (existingEmail) {
          return res.status(400).json({ success: false, error: getClientErrorMessage('auth_create_failed', 'Gagal membuat karyawan: Email sudah terdaftar di sistem.') });
        }
      }

      // Cek duplikasi PIN
      if (employeeData.pin_mesin) {
        const pinStr = String(employeeData.pin_mesin).trim();
        if (pinStr) {
          const { data: existingPin } = await context.dbClient
            .from('employees')
            .select('id')
            .eq('pin_mesin', pinStr)
            .maybeSingle();

          if (existingPin) {
            return res.status(400).json({ success: false, error: 'Gagal membuat karyawan: ID/PIN Mesin sudah terdaftar pada karyawan lain.' });
          }
        }
      }

      // Buat user auth
      let userId = employeeData.user_id || employeeData.userId || null;
      let isDefaultPassword = false;
      let passwordToUse = password;

      if (employeeData.email) {
        const authRes = await createOrRecoverAuthUser(
          adminSupabase,
          context.dbClient,
          employeeData.email,
          employeeData.nama || employeeData.name,
          password,
          loggingService
        );
        userId = authRes.userId;
        passwordToUse = authRes.passwordToUse;
        isDefaultPassword = authRes.isDefaultPassword;
      }

      const profilePayload = normalizeEmployeeData(employeeData);
      if (userId) profilePayload.user_id = userId;

      const profileClient = adminSupabase || context.dbClient;
      const { data: newEmployee, error: profileError } = await profileClient
        .from('employees')
        .insert(profilePayload)
        .select('*')
        .single();

      if (profileError || !newEmployee) {
        logDetailedError('Employee.create.profile', profileError, { userId, email: employeeData.email });
        return res.status(400).json({
          success: false,
          error: `Gagal menyimpan profil karyawan: ${profileError?.message || 'Database insert error'}`,
        });
      }

      if (employeeData.email) {
        void sendWelcomeEmail({
          email: employeeData.email,
          nama: newEmployee.nama || employeeData.nama,
          nik: newEmployee.nik || employeeData.nik,
          password: passwordToUse,
          isDefaultPassword,
        }).catch((err) => loggingService.warn('Employee.create.welcomeEmail.failed', { error: err?.message }));
      }

      if (Array.isArray(documents) && documents.length > 0) {
        const docsToInsert = documents.map((doc) => ({
          employeeId: newEmployee.id,
          name: doc?.name,
          type: doc?.type,
          fileUrl: doc?.fileUrl,
          uploadedAt: doc?.uploadedAt || new Date().toISOString(),
        }));
        await context.dbClient.from('documents').insert(docsToInsert);
      }

      await invalidateEmployeeCaches(newEmployee);
      return res.status(201).json({ success: true, data: newEmployee });
    } catch (err) {
      logDetailedError('Employee.create.endpoint', err, { email: req.body?.employeeData?.email });
      return res.status(500).json({
        success: false,
        error: getClientErrorMessage('internal_error', 'Terjadi kesalahan internal. Silakan coba lagi.'),
        details: isProd ? undefined : err?.message,
      });
    }
  });

  // PUT /:id
  router.put('/:id', validate(updateEmployeeSchema), async (req, res) => {
    try {
      const context = await getRequesterContext(req);
      if (!context.ok) {
        return res.status(context.status).json({ success: false, error: context.error });
      }

      if (!canManageEmployeesRole(context.role)) {
        return res.status(403).json({ success: false, error: 'Hanya admin & HRD yang dapat mengubah data karyawan' });
      }

      const { updateData, documents = [], newPassword = '' } = req.body || {};
      if (!updateData || typeof updateData !== 'object') {
        return res.status(400).json({ success: false, error: 'updateData is required' });
      }

      const sanitizedUpdate = normalizeEmployeeUpdateData(updateData);

      const { data: targetEmployee, error: targetError } = await context.dbClient
        .from('employees')
        .select('id, user_id, nama, email, nik')
        .eq('id', req.params.id)
        .maybeSingle();

      if (targetError || !targetEmployee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const emailToUse = String(updateData.email || targetEmployee.email || '').trim();
      const hasEmailChanged = emailToUse && emailToUse !== String(targetEmployee.email || '').trim();
      if (hasEmailChanged) {
        const { data: duplicateEmail } = await context.dbClient
          .from('employees')
          .select('id')
          .eq('email', emailToUse)
          .neq('id', req.params.id)
          .maybeSingle();

        if (duplicateEmail) {
          return res.status(400).json({ success: false, error: 'Email sudah terdaftar pada karyawan lain di sistem.' });
        }
      }

      let currentUserId = targetEmployee.user_id;
      if (!currentUserId && emailToUse) {
        const authRes = await createOrRecoverAuthUser(adminSupabase, context.dbClient, emailToUse, updateData.nama || targetEmployee.nama, newPassword, loggingService);
        if (authRes.userId) {
          currentUserId = authRes.userId;
          sanitizedUpdate.user_id = authRes.userId;
        }
      }

      const writeClient = adminSupabase || context.dbClient;
      const { data: updatedEmployee, error: updateError } = await writeClient
        .from('employees')
        .update(sanitizedUpdate)
        .eq('id', req.params.id)
        .select('*')
        .single();

      if (updateError || !updatedEmployee) {
        logDetailedError('Employee.update.profile', updateError, { employeeId: req.params.id });
        return res.status(400).json({ success: false, error: 'Gagal memperbarui data karyawan.' });
      }

      if (Array.isArray(documents) && documents.length > 0) {
        const docsToInsert = documents.map((doc) => ({
          employeeId: req.params.id,
          name: doc?.name,
          type: doc?.type,
          fileUrl: doc?.fileUrl,
          uploadedAt: doc?.uploadedAt || new Date().toISOString(),
        }));
        await context.dbClient.from('documents').insert(docsToInsert);
      }

      await invalidateEmployeeCaches(updatedEmployee);
      return res.status(200).json({ success: true, data: updatedEmployee });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /:id
  router.delete('/:id', async (req, res) => {
    try {
      const context = await getRequesterContext(req);
      if (!context.ok) {
        return res.status(context.status).json({ success: false, error: context.error });
      }

      if (!canDeleteEmployeesRole(context.role)) {
        return res.status(403).json({ success: false, error: 'Hanya Super Admin yang dapat menghapus karyawan permanen' });
      }

      const { data: targetEmployee } = await context.dbClient
        .from('employees')
        .select('id, user_id, nama')
        .eq('id', req.params.id)
        .maybeSingle();

      if (!targetEmployee) {
        return res.status(404).json({ success: false, error: 'Karyawan tidak ditemukan' });
      }

      const client = adminSupabase || context.dbClient;
      const { error: delError } = await client.from('employees').delete().eq('id', req.params.id);
      if (delError) {
        return res.status(400).json({ success: false, error: delError.message });
      }

      if (targetEmployee.user_id && adminSupabase?.auth?.admin?.deleteUser) {
        try {
          await adminSupabase.auth.admin.deleteUser(targetEmployee.user_id);
        } catch (authDelErr) {
          loggingService.warn('Employee.delete.authUser.failed', { userId: targetEmployee.user_id, error: authDelErr?.message });
        }
      }

      await invalidateEmployeeCaches(targetEmployee);
      return res.status(200).json({ success: true, message: `Karyawan ${targetEmployee.nama} berhasil dihapus` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
};
