import { ApolloProvider } from "@apollo/client";
import { Redirect, Route, Switch } from "react-router-dom";
import { Suspense } from "react";
import { client } from "../lib/apollo-client";
import { NextUIProvider } from "@nextui-org/react";

import Home from "./index";

import "../styles/globals.css";

const App = () => {
  return (
    <ApolloProvider client={client}>
      <Suspense fallback={null}>
        <NextUIProvider>
          <Home />
        </NextUIProvider>
      </Suspense>
    </ApolloProvider>
  );
};

export default App;
