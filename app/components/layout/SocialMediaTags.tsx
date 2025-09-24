"use client";
import Head from "next/head";

interface SocialMediaTagsProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
}

export const SocialMediaTags: React.FC<SocialMediaTagsProps> = ({
  title,
  description,
  url,
  imageUrl,
}) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      {imageUrl && <meta property="twitter:image" content={imageUrl} />}
    </Head>
  );
};
