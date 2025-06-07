'use client'

import { Fragment, useState } from 'react'
import { Combobox as HeadlessCombobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

interface Option {
  id: string
  nombre: string
}

interface ComboboxProps {
  options: Option[]
  value: string
  onSelect: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

const Combobox = ({ options, value, onSelect, placeholder = 'Seleccionar...' }: ComboboxProps) => {
  const [query, setQuery] = useState('')

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          option.nombre.toLowerCase().includes(query.toLowerCase())
        )

  return (
    <div className="w-full">
      <HeadlessCombobox value={value} onChange={onSelect}>
        <div className="relative">
          <HeadlessCombobox.Input
            className="w-full border rounded-lg py-1 pl-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            displayValue={(val: string) => val}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
          </HeadlessCombobox.Button>
        

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <HeadlessCombobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {filteredOptions.length === 0 ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                No encontrado.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <HeadlessCombobox.Option
                  key={option.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-pink-100 text-pink-900' : 'text-gray-900'
                    }`
                  }
                  value={option.nombre}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {option.nombre}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-pink-600">
                          <CheckIcon className="h-5 w-5" />
                        </span>
                      ) : null}
                    </>
                  )}
                </HeadlessCombobox.Option>
              ))
            )}
          </HeadlessCombobox.Options>
        </Transition>
        </div>
      </HeadlessCombobox>
    </div>
  )
}

export default Combobox
