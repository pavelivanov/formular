import { useFormGroup, useForm } from '../src'


export type AuthFields = {
  email: string
  password: string
}

export type ShipmentFields = {
  zipCode: string
  city: string
  state: string
  country: string
}

type GroupForms = {
  auth?: AuthFields
  shipment: ShipmentFields
}

const useForms = () => {
  const shipmentForm = useForm<ShipmentFields>({
    fields: {
      zipCode: [],
      city: [],
      state: [],
      country: [],
    },
  })

  return useFormGroup<GroupForms>({
    shipment: shipmentForm,
  })
}

const App = () => {
  const formGroup = useForms()

  const authForm = useForm<AuthFields>({
    fields: {
      email: [],
      password: [],
    },
  })

  formGroup.attachForms({
    auth: authForm,
  })
}
