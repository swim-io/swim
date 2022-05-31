// TODO: All text and images are not finalised.

import type { EuiCommentProps } from "@elastic/eui";
import {
  EuiAccordion,
  EuiButton,
  EuiCommentList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiImage,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { useState } from "react";

import OTTER_INTEREST from "../images/otter_interest.svg";
import OTTER_REDEEM from "../images/otter_redeem.png";
import OTTER_TRAITS from "../images/otter_traits.svg";

interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

const faqEntries: readonly FaqEntry[] = [
  {
    question: "What is an NFT?",
    answer:
      "An NFT is a non fungible token- unique non-interchangeable digital assets where the ownership can be verified on the blockchain, of which can allow you unique benefits (see below for benefits of holding an Otter).",
  },
  {
    question: "How do I mint an Otter?",
    answer:
      "If your wallet is eligible for the first sale, you will be airdropped a whitelist token based on criteria announced on Discord. Using this token you will be able to mint on [mint date and time] by going to our mint page [add link to mint page].",
  },
  {
    question: "How much is the mint?",
    answer:
      "The initial mint will be 600 USDC, essentially setting an IDO price of 0.2 per SWIM token. To mint later down the line it will cost you 3000 xSWIM.",
  },
  {
    question: "When is the mint date?",
    answer: "The mint date will be [mint date and time].",
  },
  {
    question: "What is the total supply?",
    answer:
      "There will be 10000 Otters, each physically backed by 3000 xSWIM. However to redeem your xSWIM you will burn the Otter, creating a deflationary supply of Otters.",
  },
];

export const NftFaqAccordians = (): readonly ReactElement[] => {
  return faqEntries.map((faqEntry, index) => {
    return (
      <div key={index}>
        <EuiPanel>
          <EuiAccordion
            id={"faq_".concat(index.toString())}
            buttonContent={
              <EuiText>
                <h4> {faqEntry.question}</h4>
              </EuiText>
            }
            paddingSize="m"
          >
            <EuiText size="s">
              <p>{faqEntry.answer}</p>
            </EuiText>
          </EuiAccordion>
        </EuiPanel>
        <EuiSpacer />
      </div>
    );
  });
};

interface NftFeaturrette {
  readonly title: string;
  readonly text: string;
  readonly image: ReactElement;
}

export const AlternatingFeaturettes = (): readonly ReactElement[] => {
  const featurettes: readonly NftFeaturrette[] = [
    {
      title: "Interest bearing",
      text: "Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo",
      image: <EuiImage src={OTTER_INTEREST} alt="interest bearing" />,
    },
    {
      title: "Redeemable",
      text: "Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo",
      image: <EuiImage src={OTTER_REDEEM} alt="redeemable" />,
    },
    {
      title: "Traits / weekly boost",
      text: "Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo",
      image: <EuiImage src={OTTER_TRAITS} alt="trait boost" />,
    },
  ];
  return featurettes.map((featurette, index) => {
    // Logs an error without a key, does some arbritary math to create unique ones.
    const textPortion = (
      <EuiFlexItem key={featurette.title + "text"}>
        <EuiText grow={false} style={{ textAlign: "center" }}>
          <h3> {featurette.title} </h3>
        </EuiText>
        <EuiSpacer />
        <EuiText color="subdued">
          <p>{featurette.text}</p>
        </EuiText>
      </EuiFlexItem>
    );
    const imagePortion = (
      <EuiFlexItem key={featurette.title + "image"}>
        {featurette.image}
      </EuiFlexItem>
    );
    // TODO: On mobile this shouldn't alternate.
    const finishedFeaturette =
      index % 2 ? [textPortion, imagePortion] : [imagePortion, textPortion];
    return (
      <EuiFlexGroup alignItems="center" key={featurette.title}>
        {finishedFeaturette}
      </EuiFlexGroup>
    );
  });
};

export const IsWhitelistedButton = (): ReactElement => {
  const [isPressed, setIsPressed] = useState(false);
  const isWhiteListed = true; // TODO: This should be a hook (queries our whitelist somewhere)
  const buttonText = !isPressed
    ? "Click to see if whitelisted"
    : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    isWhiteListed
    ? "Whitelisted"
    : "Not whitelisted";

  const buttonColor = !isPressed
    ? "primary"
    : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    isWhiteListed
    ? "success"
    : "warning";

  return (
    <EuiButton
      fullWidth={true}
      onClick={() => {
        setIsPressed(true);
      }}
      color={buttonColor}
      fill={!isPressed}
    >
      {buttonText}
    </EuiButton>
  );
};

export const NftRoadmap = (): ReactElement => {
  // eslint-disable-next-line functional/prefer-readonly-type
  const comments: EuiCommentProps[] = [
    {
      // TODO: Could have custom icons per entry.
      timelineIcon: "arrowDown",
      username: "IDO Mint",
      children: (
        <EuiText>
          We will be holding our initial IDO of 2000 out of 10000 Otters,
          fungible for 3000 xSWIM each for a total of 30m xSWIM or 3% of total
          circulating supply. Here we can put our details of our first sale and
          second sale once we confirm the details.
        </EuiText>
      ),
    },
    {
      timelineIcon: "arrowDown",
      username: "Secondary Market listing",
      children: (
        <EuiText>
          Once we have finished our initial IDO (second sale of Otters) you will
          be able to immediately trade your Otters on Magic Eden and Opensea as
          verified collections, protecting the buyers and sellers as well as
          receiving liquidity on the most popular exchanges on Solana.
        </EuiText>
      ),
    },
    {
      timelineIcon: "arrowDown",
      username: "Redeemability",
      children: (
        <EuiText>
          After we finish our initial IDO, we will launch the redeem function
          for the NFTs so you can burn your Otter for 3000 xSWIM at any time.
          This will tie in with our exchange listing for SWIM, giving holders
          enough time to prepare for both the centralized and decentralized
          exchange listing of SWIM.
        </EuiText>
      ),
    },
    {
      timelineIcon: "arrowDown",
      username: "NFT emissions",
      children: (
        <EuiText>
          Holders of the Otters will receive x amount of SWIM a day, with a base
          rate of 2/3 SWIM a day. The emissions will be based off the table
          below:
        </EuiText>
      ),
    },
  ];

  return <EuiCommentList comments={comments} />;
};
