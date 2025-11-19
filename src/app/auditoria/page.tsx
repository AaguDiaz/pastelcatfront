'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormAuditoria from '@/components/forms/FormAuditoria';
import FormHistorialMateriaPrima from '@/components/forms/FormHistorialMateriaPrima';
import { useAuditoriaData } from '@/hooks/useAuditoriaData';
import { Button } from '@/components/ui/button';

export default function AuditoriaPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  const {
    authSummary,
    authSummaryLoading,
    authEvents,
    authEventsLoading,
    authEventsTotalPages,
    authFilters,
    setAuthDateRange,
    setAuthType,
    setAuthPage,
    reloadAuthSummary,
    reloadAuthEvents,
    materiaResumen,
    materiaResumenLoading,
    materiaHistorial,
    materiaHistorialLoading,
    materiaHistorialTotalPages,
    materiaFilters,
    materiaOptions,
    setMateriaId,
    setMateriaSearch,
    setMateriaDateRange,
    setMateriaPage,
    reloadMateriaHistorial,
    reloadMateriaResumen,
    errorMessage,
    clearError,
  } = useAuditoriaData();

  return (
    <div className="min-h-screen space-y-8 bg-pastel-beige p-4 md:p-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-neutral-600">Seguridad</p>
        <h1 className="text-3xl font-bold text-neutral-900">Auditoria</h1>
        <p className="text-neutral-600">
          Vista unificada de accesos y cambios en materia prima.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
          <div className="flex items-center justify-between gap-3">
            <span className="flex-1">{errorMessage}</span>
            <Button
              type="button"
              variant="ghost"
              className="text-red-700 hover:bg-red-100"
              onClick={clearError}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      <FormAuditoria
        summary={authSummary}
        summaryLoading={authSummaryLoading}
        events={authEvents}
        loading={authEventsLoading}
        page={authFilters.page}
        totalPages={authEventsTotalPages}
        filters={{
          from: authFilters.from,
          to: authFilters.to,
          type: authFilters.type,
        }}
        onDateChange={setAuthDateRange}
        onTypeChange={setAuthType}
        onPageChange={setAuthPage}
        onReload={() => {
          reloadAuthSummary();
          reloadAuthEvents();
        }}
      />

      <FormHistorialMateriaPrima
        resumen={materiaResumen}
        historial={materiaHistorial}
        loadingResumen={materiaResumenLoading}
        loadingHistorial={materiaHistorialLoading}
        page={materiaFilters.page}
        totalPages={materiaHistorialTotalPages}
        filters={{
          materiaId: materiaFilters.materiaId,
          search: materiaFilters.search,
          from: materiaFilters.from,
          to: materiaFilters.to,
        }}
        materiaOptions={materiaOptions}
        onMateriaChange={setMateriaId}
        onSearchChange={setMateriaSearch}
        onDateChange={setMateriaDateRange}
        onPageChange={setMateriaPage}
      />
    </div>
  );
}
