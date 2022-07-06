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

import { useTitle } from "../hooks";
import DISCORD_SVG from "../images/social/discord.svg";
import TELEGRAM_SVG from "../images/social/telegram.svg";

const HelpPage = (): ReactElement => {
  useTitle("Help");
  return (
    <EuiPage className="helpPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiEmptyPrompt
              iconType="questionInCircle"
              title={<h2>Get Help</h2>}
              body={
                <p>
                  <span>
                    We have a quickly growing collection of troubleshooting
                    articles and tutorials in our GitBook. If you cannot find
                    the answer you are looking for there, feel free to ask your
                    question in our Discord, Telegram communities, or reach out
                    to use at
                  </span>
                  <a href="mailto:support@swim.io"> support@swim.io</a>
                  <span>.</span>
                </p>
              }
              actions={
                <EuiButton
                  color="primary"
                  fill
                  href="https://docs.swim.io/troubleshoot/diagnosing-failed-swap-transactions"
                >
                  Go to Docs
                </EuiButton>
              }
            />

            <EuiSpacer />

            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiCard
                  icon={<EuiIcon size="xxl" type={DISCORD_SVG} />}
                  title="Discord"
                  description="Join our community on Discord to get quick help from developers and the community."
                  footer={
                    <div>
                      <EuiButton href="https://discord.gg/wGrxQ7GAgP">
                        Join Discord
                      </EuiButton>
                    </div>
                  }
                />
              </EuiFlexItem>

              <EuiFlexItem>
                <EuiCard
                  icon={<EuiIcon size="xxl" type={TELEGRAM_SVG} />}
                  title="Telegram"
                  description="Join our Telegram group to stay up to date and get help from developers and the community."
                  footer={
                    <div>
                      <EuiButton href="https://t.me/joinchat/Mnc1WjrKcq8yYTM1">
                        Open Telegram
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
