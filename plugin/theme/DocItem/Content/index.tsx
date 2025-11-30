import { type ReactNode } from "react";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import type { Props } from "@theme/DocItem/Content";
import ContentWithComments from "@site/plugins/commentasaurus/components/MDXContentWithComments";
import BrowserOnly from "@docusaurus/BrowserOnly";
import clsx from "clsx";
import Heading from "@theme/Heading";
import MDXContent from "@theme/MDXContent";
import { ThemeClassNames } from "@docusaurus/theme-common";
/**
 Title can be declared inside md content or declared through
 front matter and added manually. To make both cases consistent,
 the added title is added under the same div.markdown block
 See https://github.com/facebook/docusaurus/pull/4882#issuecomment-853021120

 We render a "synthetic title" if:
 - user doesn't ask to hide it with front matter
 - the markdown content does not already contain a top-level h1 heading
*/
function useSyntheticTitle(): string | null {
  const { metadata, frontMatter, contentTitle } = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === "undefined";
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

export default function DocItemContent({ children }: Props): ReactNode {
  const syntheticTitle = useSyntheticTitle();

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, "markdown")}>
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
        </header>
      )}

      <BrowserOnly fallback={<MDXContent>{children}</MDXContent>}>
        {() => <ContentWithComments>{children}</ContentWithComments>}
      </BrowserOnly>
      <div id="modal-root"></div>
    </div>
  );
}
