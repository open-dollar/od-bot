import Head from "next/head";

import Charts from "../components/Charts";
import Transactions from "../components/Transactions";
import Panel from "../components/Panel";
import { Divider, Button, Spacer } from "@nextui-org/react";

export default function Home() {
  return (
    <div className="items-center space-x-4 text-small">
      <Head>
        <title>🦗 Rate Update</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Spacer y={4} />
      <h1 className="">Open Dollar Bot</h1>
      <Spacer y={4} />
      <Divider className="my-4" />
      <p>
        Trigger the bot:
        <br />
        <code>{`/api/rate?key=<some-secret>`}</code>
        <br />
        <code>{`/api/oracle?key=<some-secret>`}</code>
        <br />
        <code>{`/api/analytics?key=<some-secret>`}</code>
        <br />
      </p>
      <Divider className="my-4" />
      <div className="">
        <a href="https://docs.opendollar.com" className="">
          <Button color="success" endContent={""}>
            📖 Docs
          </Button>
        </a>
      </div>
      <Divider className=" my-4" />
      <Transactions />
      <Divider className=" my-4" />

      <div className="flex mt-20">
        <div className="rotate-x-[30deg] -rotate-y-[20deg] ">
          <Panel />
        </div>
        <div className="rotate-x-[30deg] -translate-y-12 ">
          <Panel />
        </div>
        <div className="rotate-x-[30deg] rotate-y-[20deg]">
          <Panel />
        </div>
      </div>

      <Charts />
      <Divider className="my-4" />
      <Divider className="my-4" />

      <footer>
        <a
          href="https://OpenDollar.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by Open Dollar
        </a>
      </footer>
    </div>
  );
}
