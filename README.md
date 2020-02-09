# Formular

Easy way to work with forms in React. Using React Hooks 😏


## Quick start

#### Installation

```
npm install 
```

#### Usage

```jsx harmony
const App = () => {
  const form = useMemo(() => (
    new Form({
      fields: {
        email: [ required ],
        password: [ required ],
      },
    })
  ), [])

  return (
    <Input field={form.fields.email} />
  )  
}
```

Or if you need only one field you can just do

```jsx harmony
const App = () => {
  const field = useMemo(() => (
    new Field({
      validate: [ required ],
    })
  ), [])

  return (
    <Input field={field} />
  ) 
}
```

## Examples

- [Basics](https://codesandbox.io/s/formular-basics-cke7r)
