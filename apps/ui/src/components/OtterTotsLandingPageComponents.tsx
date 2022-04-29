// TODO: All text and images are not finalised.

import {
  EuiAccordion,
  EuiFlexGroup,
  EuiFlexItem,
  EuiImage,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from "@elastic/eui";
import type { ReactElement } from "react";

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
  return faqEntries.map((faqEntry, idx) => {
    return (
      <>
        <EuiPanel>
          <EuiAccordion
            id={"faq_".concat(idx.toString())}
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
      </>
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
      image: (
        <EuiImage
          src="https://www.degendojonft.com/assets/images/about/about-img.gif"
          alt=""
        />
      ),
    },
    {
      title: "Redeemable",
      text: "Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo",
      image: (
        <EuiImage
          src="https://www.degendojonft.com/assets/images/about/about-img.gif"
          alt=""
        />
      ),
    },
    {
      title: "Traits / weekly boost",
      text: "Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo",
      image: (
        <EuiImage
          src="https://www.degendojonft.com/assets/images/about/about-img.gif"
          alt=""
        />
      ),
    },
  ];
  return featurettes.map((featurette, index) => {
    const textPortion = (
      <EuiFlexItem>
        <EuiText grow={false} style={{ textAlign: "center" }}>
          <h3> {featurette.title} </h3>
        </EuiText>
        <EuiSpacer />
        <EuiText color="subdued">
          <p>{featurette.text}</p>
        </EuiText>
      </EuiFlexItem>
    );
    const imagePortion = <EuiFlexItem>{featurette.image}</EuiFlexItem>;
    const finishedFeaturette =
      index % 2 ? [textPortion, imagePortion] : [imagePortion, textPortion];
    return (
      <EuiFlexGroup alignItems="center" key={index}>
        {finishedFeaturette}
      </EuiFlexGroup>
    );
  });
};
