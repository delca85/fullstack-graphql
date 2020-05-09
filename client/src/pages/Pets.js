import React, {useState} from 'react'
import gql from 'graphql-tag'
import { useQuery, useMutation } from '@apollo/react-hooks'
import PetsList from '../components/PetsList'
import NewPetModal from '../components/NewPetModal'
import Loader from '../components/Loader'

const PETS_FIELDS = gql`
  fragment PetsFields on Pet {
    id
    name
    type
    img
    vaccinated @client
    owner {
      id
      age @client
    }
  }
`;

const ALL_PETS = gql`
  query PetsQuery {
    pets {
      ...PetsFields
    }
  }
  ${PETS_FIELDS}
`
const CREATE_PET = gql`
  mutation CreatePet($newPet: NewPetInput!){
    addPet(input: $newPet){
      ...PetsFields
    }
  }
  ${PETS_FIELDS}
`
export default function Pets () {
  const [modal, setModal] = useState(false)
  const { data, loading, error } = useQuery(ALL_PETS)
  const [createPet, newPetInfo] = useMutation(CREATE_PET, {
    update(cache, { data: { addPet } }) {
      const { pets } = cache.readQuery({ query: ALL_PETS });
      cache.writeQuery({
        query: ALL_PETS,
        data: {
          pets: [addPet, ...pets],
        }
      })
    },
  })

  const onSubmit = input => {
    setModal(false)
    createPet({
      variables: {
        newPet: input
      },
      optimisticResponse: {
        __typename: 'Mutation',
        addPet: {
          __typename: 'Pet',
          id: Math.floor(Math.random()*1000) + '', 
          name: input.name,
          type: input.type,
          img: data.pets.filter(pet => pet.type === input.type)[0].img,
          owner: {
            id: Math.floor(Math.random() * 1000) + '',
            age: 35
          }
        },
      }
    })
  }

  if (loading ) {
    return <Loader/>
  }

  if (error || newPetInfo.error) {
    return <p>Error!</p>
  }
  
  if (modal) {
    return <NewPetModal onSubmit={onSubmit} onCancel={() => setModal(false)} />
  }
  console.log('age', data.pets[0])
  return (
    <div className="page pets-page">
      <section>
        <div className="row betwee-xs middle-xs">
          <div className="col-xs-10">
            <h1>Pets</h1>
          </div>

          <div className="col-xs-2">
            <button onClick={() => setModal(true)}>new pet</button>
          </div>
        </div>
      </section>
      <section>
        <PetsList pets={ data.pets }/>
      </section>
    </div>
  )
}