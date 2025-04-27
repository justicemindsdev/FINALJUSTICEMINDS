import React from 'react'

const Welcome = () => {
  return (
    <div className='flex flex-col justify-center text-center w-full items-center h-full opacity-80'>
        <img src="/logomain.png" width={"400px"} alt="" />
        <p className='text-lg'>Please select a Name from the List</p>
    </div>
  )
}

export default Welcome