import {
  EuiButton,
  EuiCard,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { useTitle } from "../hooks";
import DISCORD_SVG from "../images/social/discord.svg";
import TELEGRAM_SVG from "../images/social/telegram.svg";

const HelpPage = (): ReactElement => {
  const { t } = useTranslation();
  useTitle(t("nav.help"));
  return (
    <EuiPage className="helpPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiEmptyPrompt
              iconType="questionInCircle"
              title={<h2>{t("help_page.page_header")}</h2>}
              body={<p>{t("help_page.documentation_description")}</p>}
              actions={
                <EuiButton
                  color="primary"
                  fill
                  href="https://docs.swim.io/troubleshoot/diagnosing-failed-swap-transactions"
                >
                  {t("help_page.go_to_documentation")}
                </EuiButton>
              }
            />

            <EuiSpacer />

            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiCard
                  icon={<EuiIcon size="xxl" type={DISCORD_SVG} />}
                  title="Discord"
                  description={t("help_page.discord_description") ?? ""}
                  footer={
                    <div>
                      <EuiButton href="https://discord.gg/wGrxQ7GAgP">
                        {t("help_page.go_to_discord")}
                      </EuiButton>
                    </div>
                  }
                />
              </EuiFlexItem>

              <EuiFlexItem>
                <EuiCard
                  icon={<EuiIcon size="xxl" type={TELEGRAM_SVG} />}
                  title="Telegram"
                  description={t("help_page.telegram_description") ?? ""}
                  footer={
                    <div>
                      <EuiButton href="https://t.me/joinchat/Mnc1WjrKcq8yYTM1">
                        {t("help_page.go_to_telegram")}
                      </EuiButton>
                    </div>
                  }
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default HelpPage;
