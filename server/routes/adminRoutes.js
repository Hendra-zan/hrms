/**
 * ADMIN API ROUTES
 * Secure server-side routes for administrative operations requiring service_role privilege.
 * Requires valid JWT bearer token with admin/hrd role.
 */

export function setupAdminRoutes(app, { adminSupabase, getRequesterContext, canManageEmployeesRole, loggingService }) {
  if (!adminSupabase) {
    loggingService?.warn('adminSupabase client is not configured; admin routes will fail');
  }

  // 1. Update Employee Device (e.g. toggle isPrimary)
  app.post('/api/admin/devices/update', async (req, res) => {
    try {
      const context = await getRequesterContext(req);
      if (!context.ok) return res.status(context.status).json({ error: context.error });
      if (!canManageEmployeesRole(context.role)) {
        return res.status(403).json({ error: 'Akses ditolak: Memerlukan hak akses Admin/HRD.' });
      }

      const { id, updates } = req.body || {};
      if (!id || !updates) {
        return res.status(400).json({ error: 'Parameter id dan updates wajib diisi.' });
      }

      const { data, error } = await adminSupabase
        .from('employee_devices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        loggingService?.error('Failed to update device via admin route', { id, error: error.message });
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true, data });
    } catch (err) {
      loggingService?.error('Admin device update exception', { error: err.message });
      return res.status(500).json({ error: 'Terjadi kesalahan sistem saat memperbarui perangkat.' });
    }
  });

  // 2. Delete Employee Device
  app.post('/api/admin/devices/delete', async (req, res) => {
    try {
      const context = await getRequesterContext(req);
      if (!context.ok) return res.status(context.status).json({ error: context.error });
      if (!canManageEmployeesRole(context.role)) {
        return res.status(403).json({ error: 'Akses ditolak: Memerlukan hak akses Admin/HRD.' });
      }

      const { id } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'Parameter id wajib diisi.' });
      }

      const { error } = await adminSupabase
        .from('employee_devices')
        .delete()
        .eq('id', id);

      if (error) {
        loggingService?.error('Failed to delete device via admin route', { id, error: error.message });
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true });
    } catch (err) {
      loggingService?.error('Admin device delete exception', { error: err.message });
      return res.status(500).json({ error: 'Terjadi kesalahan sistem saat menghapus perangkat.' });
    }
  });

  // 3. Enroll Employee Fingerprint Template
  app.post('/api/admin/fingerprint/enroll', async (req, res) => {
    try {
      const context = await getRequesterContext(req);
      if (!context.ok) return res.status(context.status).json({ error: context.error });
      if (!canManageEmployeesRole(context.role)) {
        return res.status(403).json({ error: 'Akses ditolak: Memerlukan hak akses Admin/HRD.' });
      }

      const { employeeId, template, format } = req.body || {};
      if (!employeeId || !template) {
        return res.status(400).json({ error: 'Parameter employeeId dan template wajib diisi.' });
      }

      const nowIso = new Date().toISOString();
      const { error } = await adminSupabase
        .from('employees')
        .update({
          fingerprint_template: template,
          fingerprint_format: format || 'ANSI-378',
          fingerprint_enrolled_at: nowIso,
          fingerprint_verification_enabled: true,
        })
        .eq('id', employeeId);

      if (error) {
        loggingService?.error('Failed to enroll fingerprint via admin route', { employeeId, error: error.message });
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true, enrolledAt: nowIso });
    } catch (err) {
      loggingService?.error('Admin fingerprint enroll exception', { error: err.message });
      return res.status(500).json({ error: 'Terjadi kesalahan sistem saat mendaftarkan sidik jari.' });
    }
  });

  // 4. Remove Employee Fingerprint Template
  app.post('/api/admin/fingerprint/remove', async (req, res) => {
    try {
      const context = await getRequesterContext(req);
      if (!context.ok) return res.status(context.status).json({ error: context.error });
      if (!canManageEmployeesRole(context.role)) {
        return res.status(403).json({ error: 'Akses ditolak: Memerlukan hak akses Admin/HRD.' });
      }

      const { employeeId } = req.body || {};
      if (!employeeId) {
        return res.status(400).json({ error: 'Parameter employeeId wajib diisi.' });
      }

      const { error } = await adminSupabase
        .from('employees')
        .update({
          fingerprint_template: null,
          fingerprint_enrolled_at: null,
          fingerprint_verification_enabled: false,
        })
        .eq('id', employeeId);

      if (error) {
        loggingService?.error('Failed to remove fingerprint via admin route', { employeeId, error: error.message });
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true });
    } catch (err) {
      loggingService?.error('Admin fingerprint remove exception', { error: err.message });
      return res.status(500).json({ error: 'Terjadi kesalahan sistem saat menghapus sidik jari.' });
    }
  });
}
