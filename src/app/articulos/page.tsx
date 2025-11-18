'use client';

import FormGestionArticulos from '@/components/forms/FormGestionArticulos';
import FormTablaArticulos from '@/components/forms/FormTablaArticulos';
import CategoriaModal from '@/components/modals/categoriaModal';
import ModalError from '@/components/modals/error';
import ModalExito from '@/components/modals/exito';
import EliminarModal from '@/components/modals/eliminar';
import { useArticuloData } from '@/hooks/useArticuloData';
import { Articulo } from '@/interfaces/articulos';

const ArticulosPage = () => {
  const {
    articulos,
    categorias,
    categoriaSelectOptions,
    tableLoading,
    form,
    isEditing,
    formLoading,
    search,
    categoriaFilter,
    page,
    totalPages,
    pageControls,
    handleFieldChange,
    handleSubmit,
    resetForm,
    startEdit,
    requestDeleteArticulo,
    handleEliminarArticuloResponse,
    handleSearchChange,
    handleCategoriaFilterChange,
    handlePageChange,
    modalError,
    modalExito,
    closeErrorModal,
    closeExitoModal,
    modalEliminarArticulo,
    modalEliminarCategoria,
    handleEliminarCategoriaResponse,
    categoriaModal,
    requireCategorySelection,
  } = useArticuloData();

  const handleReactivateArticulo = (articulo: Articulo) => {
    startEdit(articulo);
    window?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="space-y-6 p-6">
      <FormGestionArticulos
        form={form}
        categoriaOptions={categoriaSelectOptions}
        isEditing={isEditing}
        loading={formLoading}
        requireCategorySelection={requireCategorySelection}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmit}
        onReset={resetForm}
        onOpenCategoriaModal={categoriaModal.onOpen}
      />

      <FormTablaArticulos
        articulos={articulos}
        categorias={categorias}
        search={search}
        categoriaFilter={categoriaFilter}
        page={page}
        totalPages={totalPages}
        loading={tableLoading}
        pageControls={pageControls}
        onSearchChange={handleSearchChange}
        onFilterChange={handleCategoriaFilterChange}
        onPageChange={handlePageChange}
        onEdit={startEdit}
        onDelete={requestDeleteArticulo}
        onReactivate={handleReactivateArticulo}
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

      {modalEliminarArticulo.open && modalEliminarArticulo.articulo && (
        <EliminarModal
          nombre={modalEliminarArticulo.articulo.nombre}
          contexto="articulos"
          mensaje="El articulo se eliminara o se marcara como baja segun su uso."
          onClose={handleEliminarArticuloResponse}
        />
      )}

      {modalEliminarCategoria.open && modalEliminarCategoria.categoria && (
        <EliminarModal
          nombre={modalEliminarCategoria.categoria.nombre}
          contexto="categorias"
          mensaje="Esta accion eliminara la categoria si no tiene articulos asociados."
          onClose={handleEliminarCategoriaResponse}
        />
      )}

      {categoriaModal.open && (
        <CategoriaModal
          open={categoriaModal.open}
          categorias={categorias}
          nombre={categoriaModal.nombre}
          isEditing={categoriaModal.isEditing}
          loading={categoriaModal.loading}
          onClose={categoriaModal.onClose}
          onNameChange={categoriaModal.onNameChange}
          onSubmit={categoriaModal.onSubmit}
          onEdit={categoriaModal.onEdit}
          onDelete={categoriaModal.onDelete}
        />
      )}
    </main>
  );
};

export default ArticulosPage;
