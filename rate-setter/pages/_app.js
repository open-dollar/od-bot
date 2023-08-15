import { ApolloProvider } from '@apollo/client'
import { Redirect, Route, Switch } from 'react-router-dom'
import { Suspense } from 'react'
import { client } from "../lib/apollo-client";

import Home from "./index"

const App = () => {
    return (
        <ApolloProvider client={client}>
            <Suspense fallback={null}>
                <Home />
            </Suspense>
        </ApolloProvider>
    )
}

export default App
