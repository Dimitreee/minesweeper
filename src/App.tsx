import React from 'react';
import styled from 'styled-components'

const AppContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`

function App() {
  return (
    <AppContainer>
      <header className="App-header">
        Learn React
      </header>
    </AppContainer>
  );
}

export default App;
