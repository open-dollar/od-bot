import Head from "next/head";

import Charts from "../components/Charts";
import Transactions from "../components/Transactions";
import {
    Divider,
    Button,
    Spacer,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem
} from "@nextui-org/react";
import { useState } from "react";

export default function Home() {
    const [selectedNetwork, setSelectedNetwork] = useState('');

    interface NetworkItem {
        key: string;
        label: string;
    }

    const networkItems: NetworkItem[] = [
        { key: "ARBITRUM", label: "Arbitrum" },
        { key: "OPTIMISM", label: "Optimism" },
        { key: "ARBITRUM_SEPOLIA", label: "Arbitrum Sepolia" },
    ];

    return (
    <div className="items-center space-x-4 text-small">
      <Head>
        <title>🦗 Rate Update</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Spacer y={4} />
      <h1 className="">Open Dollar Bot</h1>
        <Spacer y={2} />
        <Dropdown>
            <DropdownTrigger>
                <Button>Select Network</Button>
            </DropdownTrigger>
            <DropdownMenu
                aria-label="Network Selection"
                items={networkItems}
                onAction={(key: any) => setSelectedNetwork(key)}
            >
                {(item: NetworkItem) => (
                    <DropdownItem key={item.key}>{item.label}</DropdownItem>
                )}
            </DropdownMenu>
        </Dropdown>
        <Spacer y={4} />
      <Divider className="my-4" />
      <div className="">
        <a href="https://docs.opendollar.com" className="">
          <Button color="success" endContent={""}>
            📖 Docs
          </Button>
        </a>
      </div>
      <Divider className=" my-4" />
      <Transactions network={selectedNetwork} />
      <Divider className=" my-4" />

      {/* <div className="flex mt-20">
        <div className="rotate-x-[30deg] -rotate-y-[20deg] ">
          <Panel />
        </div>
        <div className="rotate-x-[30deg] -translate-y-12 ">
          <Panel />
        </div>
        <div className="rotate-x-[30deg] rotate-y-[20deg]">
          <Panel />
        </div>
      </div> */}

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
