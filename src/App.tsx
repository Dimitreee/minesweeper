import React from 'react';
import styled from 'styled-components'
import { Field } from './components/Field'

const AppContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

function App() {
    return (
        <AppContainer>
            <Field width={10000} height={10000}/>
        </AppContainer>
    );
}

export default App;
