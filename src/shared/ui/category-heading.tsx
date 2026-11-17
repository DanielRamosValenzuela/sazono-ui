import type { ComponentPropsWithoutRef } from "react";

const HEADING_TAGS = ["h3", "h4", "h5"] as const;

type CategoryHeadingProps = ComponentPropsWithoutRef<"h3"> & {
  depth?: number;
};

export function CategoryHeading({ depth = 0, ...props }: CategoryHeadingProps) {
  const Tag = HEADING_TAGS[depth] ?? "h5";

  return <Tag {...props} />;
}
