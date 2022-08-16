// do not translate terms of service for legal reasons
/* eslint-disable i18next/no-literal-string */

import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from "@elastic/eui";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { useTitle } from "../hooks";

const TosPage = (): ReactElement => {
  const { t } = useTranslation();
  useTitle(t("nav.terms_of_service"));
  return (
    <EuiPage className="tosPage" restrictWidth={800}>
      <EuiPageBody>
        <EuiPageContent verticalPosition="center">
          <EuiPageContentBody>
            <EuiTitle>
              <h2>{t("nav.terms_of_service")}</h2>
            </EuiTitle>
            <EuiSpacer />
            <EuiText>
              <span>
                This website-hosted user interface (this &quot;Interface&quot;)
                is made available by The Swim Protocol Foundation. This
                Interface is an open source software portal to the Swim
                Protocol, a protocol which is a community-driven collection of
                blockchain-enabled smart contracts and tools maintained by The
                Swim Protocol Foundation.
              </span>
              <br />
              <br />
              <span>
                THIS INTERFACE AND THE SWIM PROTOCOL ARE PROVIDED
                &quot;AS-IS&quot;, AT YOUR OWN RISK, AND WITHOUT WARRANTIES OF
                ANY KIND.
              </span>
              <br />
              <br />
              <span>
                Neither The Swim Protocol Foundation nor any of its affiliates
                provides, owns, or controls the Swim Protocol. By using or
                accessing this Interface or the Swim Protocol, you agree that no
                developer or entity involved in creating, deploying or
                maintaining this Interface or the Swim Protocol, including The
                Swim Protocol Foundation, Swim Protocol Ltd., or Terok Tech
                Limited, will be liable for any claims or damages whatsoever
                associated with your use, inability to use, or your interaction
                with other users of, this Interface or the Swim Protocol,
                including any direct, indirect, incidental, special, exemplary,
                punitive or consequential damages, or loss of profits,
                cryptocurrencies, tokens, or anything else of value.
              </span>
              <br />
              <br />
              <span>
                By using or accessing this Interface, you represent that you are
                not subject to sanctions or otherwise designated on any list of
                prohibited or restricted parties or excluded or denied persons,
                including but not limited to the lists maintained by the United
                States Department of Treasury’s Office of Foreign Assets
                Control, the United Nations Security Council, the European Union
                or its Member States, or any other government authorities.
              </span>
              <br />
              <br />
              <span>
                <span>Contact us at </span>
                <a href="mailto:info@swim.io">info@swim.io</a>
                {"."}
              </span>
            </EuiText>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export default TosPage;
