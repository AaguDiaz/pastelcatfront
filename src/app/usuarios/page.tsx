'use client';

import FormGestionUsuario from '@/components/forms/FormGestionUsuario';
import FormTablaUsuario from '@/components/forms/FormTablaUsuario';
import ModalError from '@/components/modals/error';
import ModalExito from '@/components/modals/exito';
import EliminarModal from '@/components/modals/eliminar';
import { useUsuarioData } from '@/hooks/useUsuarioData';

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
    handleGestionPermisos,
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
  } = useUsuarioData();

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
        onGestionPermisos={handleGestionPermisos}
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
    </main>
  );
};

export default UsuariosPage;

