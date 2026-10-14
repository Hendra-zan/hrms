/**
 * server/routes/employees/employeePinRoutes.js
 * Rute pengelolaan dan sinkronisasi PIN mesin absensi karyawan.
 */

export const registerEmployeePinRoutes = (router, deps) => {
  const {
    getRequesterContext,
    canManageEmployeesRole,
    adminSupabase,
    loggingService,
  } = deps;

  router.post('/bulk-sync-pin', async (req, res) => {
    try {
      const context = await getRequesterContext(req);
      if (!context.ok) {
        return res.status(context.status).json({ success: false, error: context.error });
      }

      if (!canManageEmployeesRole(context.role)) {
        return res.status(403).json({ success: false, error: 'Hanya admin & HRD yang dapat menyinkronkan PIN mesin' });
      }

      const { mappings = [] } = req.body || {};
      if (!Array.isArray(mappings) || mappings.length === 0) {
        return res.status(400).json({ success: false, error: 'Mappings array is required' });
      }

      const client = adminSupabase || context.dbClient;
      let updatedCount = 0;
      const errors = [];

      for (const item of mappings) {
        if (!item.id || !item.pin_mesin) continue;
        const { error } = await client
          .from('employees')
          .update({ pin_mesin: String(item.pin_mesin).trim() })
          .eq('id', item.id);

        if (error) {
          errors.push({ id: item.id, error: error.message });
        } else {
          updatedCount++;
        }
      }

      loggingService.info('Employee.bulkSyncPin.completed', { updatedCount, total: mappings.length });
      return res.status(200).json({ success: true, updatedCount, errors });
    } catch (err) {
      loggingService.error('Employee.bulkSyncPin.error', { error: err.message });
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/pin-status', async (req, res) => {
    try {
      const context = await getRequesterContext(req);
      if (!context.ok) {
        return res.status(context.status).json({ success: false, error: context.error });
      }

      const client = adminSupabase || context.dbClient;
      const { data, error } = await client
        .from('employees')
        .select('id, nama, nik, pin_mesin, status')
        .eq('status', 'Aktif')
        .order('nama', { ascending: true });

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      const mapped = (data || []).filter((e) => Boolean(e.pin_mesin));
      const unmapped = (data || []).filter((e) => !e.pin_mesin);

      return res.status(200).json({
        success: true,
        totalActive: (data || []).length,
        mappedCount: mapped.length,
        unmappedCount: unmapped.length,
        unmappedEmployees: unmapped.map((e) => ({ id: e.id, nama: e.nama, nik: e.nik })),
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
};
