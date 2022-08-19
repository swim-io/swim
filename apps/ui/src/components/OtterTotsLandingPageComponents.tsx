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
import { useTranslation } from "react-i18next";

import OTTER_INTEREST from "../images/otter_interest.svg";
import OTTER_REDEEM from "../images/otter_redeem.png";
import OTTER_TRAITS from "../images/otter_traits.svg";

interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

export const NftFaqAccordians = (): readonly ReactElement[] => {
  const { t } = useTranslation();

  const faqEntries: readonly FaqEntry[] = [
    {
      question: t("otter_tots_page.question1"),
      answer: t("otter_tots_page.question1_answer"),
    },
    {
      question: t("otter_tots_page.question2"),
      answer: t("otter_tots_page.question2_answer"),
    },
    {
      question: t("otter_tots_page.question3"),
      answer: t("otter_tots_page.question3_answer"),
    },
    {
      question: t("otter_tots_page.question4"),
      answer: t("otter_tots_page.question4_answer"),
    },
    {
      question: t("otter_tots_page.question5"),
      answer: t("otter_tots_page.question5_answer"),
    },
  ];

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
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);
  const isWhiteListed = true; // TODO: This should be a hook (queries our whitelist somewhere)
  const buttonText = !isPressed
    ? t("otter_tots_page.check_if_whitelisted")
    : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    isWhiteListed
    ? t("otter_tots_page.is_whitelisted")
    : t("otter_tots_page.is_not_whitelisted");

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
  const { t } = useTranslation();
  // eslint-disable-next-line functional/prefer-readonly-type
  const comments: EuiCommentProps[] = [
    {
      // TODO: Could have custom icons per entry.
      timelineIcon: "arrowDown",
      username: t("otter_tots_page.roadmap1"),
      children: <EuiText>{t("otter_tots_page.roadmap1_description")}</EuiText>,
    },
    {
      timelineIcon: "arrowDown",
      username: t("otter_tots_page.roadmap2"),
      children: <EuiText>{t("otter_tots_page.roadmap2_description")}</EuiText>,
    },
    {
      timelineIcon: "arrowDown",
      username: t("otter_tots_page.roadmap3"),
      children: <EuiText>{t("otter_tots_page.roadmap3_description")}</EuiText>,
    },
    {
      timelineIcon: "arrowDown",
      username: t("otter_tots_page.roadmap4"),
      children: <EuiText>{t("otter_tots_page.roadmap4_description")}</EuiText>,
    },
  ];

  return <EuiCommentList comments={comments} />;
};
