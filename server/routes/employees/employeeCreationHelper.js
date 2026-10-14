/**
 * server/routes/employees/employeeCreationHelper.js
 * Helper untuk auto-generate NIK RSUD Meloy, resolusi unit, dan pembuatan Supabase Auth user.
 */

export async function generateAutoNik(dbClient, employeeData) {
  if (employeeData.nik && String(employeeData.nik).trim()) {
    return String(employeeData.nik).trim();
  }

  try {
    const hireDateObj = employeeData.hireDate ? new Date(employeeData.hireDate) : new Date();
    const year = String(hireDateObj.getFullYear()).slice(-2);
    const month = String(hireDateObj.getMonth() + 1).padStart(2, '0');

    let unitCode = '17';
    if (employeeData.unitKerjaId) {
      const { data: uData } = await dbClient
        .from('units')
        .select('kode')
        .eq('id', employeeData.unitKerjaId)
        .maybeSingle();
      if (uData?.kode) {
        unitCode = String(uData.kode).padStart(2, '0');
      }
    }

    let posCode = '26';
    if (employeeData.jabatan) {
      const { data: pData } = await dbClient
        .from('positions')
        .select('kode')
        .eq('nama', employeeData.jabatan)
        .maybeSingle();
      if (pData?.kode) {
        posCode = String(pData.kode).padStart(2, '0');
      }
    }

    const prefix = `${year}${month}${unitCode}${posCode}`;

    const { data: existingNiks } = await dbClient
      .from('employees')
      .select('nik')
      .like('nik', `${prefix}%`)
      .order('nik', { ascending: false })
      .limit(1);

    let seqNum = 1;
    if (existingNiks && existingNiks.length > 0 && existingNiks[0].nik) {
      const lastNik = existingNiks[0].nik;
      if (lastNik.length === 11 && lastNik.startsWith(prefix)) {
        const lastSeq = parseInt(lastNik.substring(8), 10);
        if (!isNaN(lastSeq)) {
          seqNum = lastSeq + 1;
        }
      }
    }

    return `${prefix}${String(seqNum).padStart(3, '0')}`;
  } catch (err) {
    const fallbackYear = String(new Date().getFullYear()).slice(-2);
    const fallbackMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    return `${fallbackYear}${fallbackMonth}1726001`;
  }
}

export async function resolveUnitId(dbClient, unitKerjaId) {
  if (!unitKerjaId || typeof unitKerjaId !== 'string') return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(unitKerjaId);
  if (isUuid) return unitKerjaId;

  try {
    const { data: matchedUnit } = await dbClient
      .from('units')
      .select('id')
      .or(`nama.ilike.${unitKerjaId},kode.ilike.${unitKerjaId}`)
      .maybeSingle();
    return matchedUnit?.id || null;
  } catch {
    return null;
  }
}

export async function createOrRecoverAuthUser(adminSupabase, dbClient, email, name, rawPassword, loggingService) {
  const emailToUse = String(email || '').trim();
  if (!emailToUse) return { userId: null, passwordToUse: null, isDefaultPassword: false };

  let passwordToUse = rawPassword ? String(rawPassword).trim() : '';
  let isDefaultPassword = false;
  if (!passwordToUse) {
    passwordToUse = 'M123456';
    isDefaultPassword = true;
  }

  const authClient = adminSupabase || dbClient;
  const { data: authData, error: authError } = await authClient.auth.admin.createUser({
    email: emailToUse,
    password: passwordToUse,
    email_confirm: true,
    user_metadata: {
      name: name || emailToUse,
      must_change_password: isDefaultPassword,
    },
  });

  if (authError || !authData?.user) {
    let recoveredUserId = null;
    if (authClient?.auth?.admin?.listUsers) {
      try {
        const { data: listData } = await authClient.auth.admin.listUsers();
        const foundUser = (listData?.users || []).find((u) => u.email?.toLowerCase() === emailToUse.toLowerCase());
        if (foundUser) {
          recoveredUserId = foundUser.id;
        }
      } catch (recoveryErr) {
        loggingService.warn('Employee.auth.recoveryError', { email: emailToUse, error: recoveryErr?.message });
      }
    }

    if (recoveredUserId) {
      return { userId: recoveredUserId, passwordToUse, isDefaultPassword };
    }
    loggingService.warn('Employee.auth.warning', { email: emailToUse, error: authError?.message });
    return { userId: null, passwordToUse, isDefaultPassword };
  }

  return { userId: authData.user.id, passwordToUse, isDefaultPassword };
}
