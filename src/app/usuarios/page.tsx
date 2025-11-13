'use client';

import { useRef } from 'react';
import FormGestionUsuario from '@/components/forms/FormGestionUsuario';
import FormGestionGrupos from '@/components/forms/FormGestionGrupos';
import FormTablaUsuario from '@/components/forms/FormTablaUsuario';
import ModalError from '@/components/modals/error';
import ModalExito from '@/components/modals/exito';
import EliminarModal from '@/components/modals/eliminar';
import UsuarioPermisosModal from '@/components/modals/usuarioPermisos';
import { useUsuarioData } from '@/hooks/useUsuarioData';
import { usePermisosData } from '@/hooks/usePermisosData';

const UsuariosPage = () => {
  const {
    usuarios,
    loading,
    form,
    isEditing,
    search,
    filter,
    page,
    totalPages,
    pageControls,
    handleInputChange,
    handleSubmit,
    cancelEdit,
    startEdit,
    toggleActivo,
    handleChangePassword,
    handleModificarPermisos,
    setSearch,
    setFilter,
    setPage,
    modalError,
    modalExito,
    closeErrorModal,
    closeExitoModal,
    modalEliminar,
    handleEliminarResponse,
    permisosModal,
  } = useUsuarioData();

  const { grupoState, modals: gruposModals } = usePermisosData();
  const permisosSectionRef = useRef<HTMLDivElement | null>(null);

  const handleGestionPermisosScroll = () => {
    permisosSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(safePage);
  };

  return (
    <main className="space-y-6 p-6">
      <FormGestionUsuario
        form={form}
        isEditing={isEditing}
        loading={loading}
        onFieldChange={handleInputChange}
        onSubmit={handleSubmit}
        onCancel={cancelEdit}
        onGestionPermisos={handleGestionPermisosScroll}
      />

      <FormTablaUsuario
        usuarios={usuarios}
        loading={loading}
        search={search}
        filter={filter}
        page={page}
        totalPages={totalPages}
        pageControls={pageControls}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
        onPageChange={handlePageChange}
        onEdit={startEdit}
        onToggleActivo={toggleActivo}
        onModificarPermisos={handleModificarPermisos}
        onChangePassword={handleChangePassword}
      />

      <div
        id="gestion-permisos"
        ref={permisosSectionRef}
        className="space-y-6"
      >
        <FormGestionGrupos state={grupoState} />
      </div>

      {modalError.open && (
        <ModalError
          titulo="Error"
          mensaje={modalError.message}
          onClose={closeErrorModal}
        />
      )}

      {modalExito.open && (
        <ModalExito
          titulo="Aviso"
          mensaje={modalExito.message}
          onClose={closeExitoModal}
        />
      )}

      {modalEliminar.open && modalEliminar.usuario && (
        <EliminarModal
          nombre={modalEliminar.usuario.nombre}
          contexto="usuarios"
          mensaje="Esta seguro que quiere dar de baja a este usuario?"
          onClose={handleEliminarResponse}
        />
      )}

      {permisosModal.open && (
        <UsuarioPermisosModal
          open={permisosModal.open}
          loading={permisosModal.loading}
          usuarioNombre={permisosModal.usuario?.nombre ?? ''}
          gruposOptions={permisosModal.gruposOptions}
          permisosOptions={permisosModal.permisosOptions}
          moduloFilter={permisosModal.moduloFilter}
          onModuloFilterChange={permisosModal.setModuloFilter}
          selectedGrupoId={permisosModal.selectedGrupoId}
          onSelectGrupo={permisosModal.setSelectedGrupoId}
          selectedPermisoId={permisosModal.selectedPermisoId}
          onSelectPermiso={permisosModal.setSelectedPermisoId}
          assignedGrupos={permisosModal.assignedGrupos}
          assignedPermisos={permisosModal.assignedPermisos}
          onAddGrupo={permisosModal.onAddGrupo}
          onAddPermiso={permisosModal.onAddPermiso}
          onRemoveGrupo={permisosModal.onRemoveGrupo}
          onRemovePermiso={permisosModal.onRemovePermiso}
          onClearSelections={permisosModal.onClearSelections}
          onConfirm={permisosModal.onConfirm}
          onClose={permisosModal.onClose}
        />
      )}

      {gruposModals.error.open && (
        <ModalError
          titulo="Error"
          mensaje={gruposModals.error.message}
          onClose={gruposModals.closeError}
        />
      )}

      {gruposModals.success.open && (
        <ModalExito
          titulo="Aviso"
          mensaje={gruposModals.success.message}
          onClose={gruposModals.closeSuccess}
        />
      )}

      {gruposModals.eliminar.open && (
        <EliminarModal
          nombre={gruposModals.eliminar.nombre || 'registro'}
          contexto={gruposModals.eliminar.contexto || 'permisos'}
          mensaje={gruposModals.eliminar.mensaje}
          onClose={gruposModals.onEliminarResponse}
        />
      )}
    </main>
  );
};

export default UsuariosPage;

