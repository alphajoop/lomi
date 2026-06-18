/* @proprietary license */

'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'fumadocs-ui/components/tabs.unstyled';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

const codeThemes = {
  light: 'github-light',
  dark: 'vesper',
} as const;

function InstallCommand({ code }: { code: string }) {
  return (
    <DynamicCodeBlock
      lang="bash"
      code={code}
      codeblock={{
        keepBackground: true,
        className: 'my-0 rounded-none border-0 bg-transparent shadow-none',
      }}
      options={{ themes: codeThemes }}
    />
  );
}

export function Installation({ name }: { name: string }) {
  const registryUrl = `https://docs.lomi.africa/r/${name}.json`;
  const tabs = [
    { name: 'npx', value: 'npx' },
    { name: 'pnpm', value: 'pnpm' },
    { name: 'yarn', value: 'yarn' },
    { name: 'bun', value: 'bun' },
  ];

  const commands: Record<string, string> = {
    npx: `npx shadcn@latest add ${registryUrl}`,
    pnpm: `pnpm dlx shadcn@latest add ${registryUrl}`,
    yarn: `yarn dlx shadcn@latest add ${registryUrl}`,
    bun: `bunx shadcn@latest add ${registryUrl}`,
  };

  return (
    <Tabs
      className="not-prose my-6 overflow-hidden rounded-sm border border-fd-border bg-fd-card text-fd-card-foreground"
      defaultValue="npx"
    >
      <TabsList className="flex flex-col gap-3 text-sm items-start border-0 bg-transparent p-3 pb-2 not-prose sm:flex-row">
        <div className="me-auto">
          <p className="font-medium">Install to your codebase</p>
          <p className="mt-1 text-fd-muted-foreground">
            Copy the component source with shadcn.
          </p>
        </div>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="font-medium text-fd-muted-foreground transition-colors data-[state=active]:text-fd-primary"
          >
            {tab.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="mt-0 border-t border-fd-border"
        >
          <InstallCommand code={commands[tab.value] ?? commands.npx} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
