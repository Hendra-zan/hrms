import React, { useEffect } from 'react';
import { Employee, AttendanceRecord, AttendanceChangeRequest } from '../../types';
import ManualAttendanceForm from './ManualAttendanceForm';
import ApprovalQueue from './ApprovalQueue';

interface ApprovalDrawerProps {
    setIsApprovalDrawerOpen: (open: boolean) => void;
    employees: Employee[];
    canManageAttendance: boolean;
    onSave: (record: Omit<AttendanceRecord, 'id'>) => Promise<boolean> | boolean;
    loadPendingRequests: () => Promise<void>;
    calculateAttendanceDetails: (employeeId: string, clockIn: string, clockOut: string, recordDate?: string) => { isLate: boolean; overtimeHours: number };
    isGeofenceConfigured: boolean;
    officeLat: number;
    officeLng: number;
    officeRadiusMeters: number;
    
    loadingPending: boolean;
    pendingRequests: AttendanceChangeRequest[];
    currentUserId?: string;
    canApproveAttendanceRequests: boolean;
    handleApproveRequest: (requestId: string) => Promise<void>;
    handleRejectRequest: (requestId: string) => Promise<void>;
}

const ApprovalDrawer: React.FC<ApprovalDrawerProps> = ({
    setIsApprovalDrawerOpen,
    employees,
    canManageAttendance,
    onSave,
    loadPendingRequests,
    calculateAttendanceDetails,
    isGeofenceConfigured,
    officeLat,
    officeLng,
    officeRadiusMeters,
    
    loadingPending,
    pendingRequests,
    currentUserId,
    canApproveAttendanceRequests,
    handleApproveRequest,
    handleRejectRequest,
}) => {
    useEffect(() => {
        void loadPendingRequests();
    }, [loadPendingRequests]);

    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                aria-label="Tutup panel approval"
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsApprovalDrawerOpen(false)}
            />
            <div role="complementary" className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-gray-200 bg-slate-50 shadow-2xl">
                <div className="sticky top-0 z-10 border-b border-gray-150 bg-white/95 backdrop-blur-md px-6 py-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#06736a]/80">Workflow</p>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">Approval Queue</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsApprovalDrawerOpen(false)}
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-95 transition-all focus:outline-none"
                            title="Tutup"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="space-y-6 p-6">
                    <ManualAttendanceForm 
                        employees={employees}
                        canManageAttendance={canManageAttendance}
                        onSave={onSave}
                        loadPendingRequests={loadPendingRequests}
                        calculateAttendanceDetails={calculateAttendanceDetails}
                        isGeofenceConfigured={isGeofenceConfigured}
                        officeLat={officeLat}
                        officeLng={officeLng}
                        officeRadiusMeters={officeRadiusMeters}
                    />

                    <ApprovalQueue 
                        loadPendingRequests={loadPendingRequests}
                        loadingPending={loadingPending}
                        pendingRequests={pendingRequests}
                        currentUserId={currentUserId}
                        canApproveAttendanceRequests={canApproveAttendanceRequests}
                        handleApproveRequest={handleApproveRequest}
                        handleRejectRequest={handleRejectRequest}
                        employees={employees}
                    />
                </div>
            </div>
        </div>
    );
};

export default ApprovalDrawer;
