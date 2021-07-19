import React from 'react';
import styled from 'styled-components'
import { Field } from './components/Field'
import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
  }
`

const AppContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`

function App() {
    return (
        <AppContainer>
            <GlobalStyle/>
            <Field size={{width: 10000, height: 10000}} totalMines={1}/>
        </AppContainer>
    );
}

export default App;
