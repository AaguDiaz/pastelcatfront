'use client'
import React from 'react'
import FormAgregarReceta from '@/components/forms/FormAgregarReceta'
import FormTablaReceta from '@/components/forms/FormTablaReceta'


const PageReceta = () => {
  return (
    <main className="p-6 ">
      <div className="flex flex-col gap-6">
          <FormAgregarReceta/>
          <FormTablaReceta />
      </div>
    </main>
  )
}

export default PageReceta
