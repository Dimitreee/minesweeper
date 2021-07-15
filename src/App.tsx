import React from 'react';
import styled from 'styled-components'
import { Field } from './components/Field'

const AppContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`

function App() {
  return (
    <AppContainer>
      <Field size={{width: 800, height: 800}} totalMines={1}/>
    </AppContainer>
  );
}

export default App;
