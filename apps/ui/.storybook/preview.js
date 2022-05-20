import "../src/App.scss"
import { AppContext } from "../src/contexts"

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const decorators = [
  (Story) => (
    <AppContext>
      <Story />
    </AppContext>
  ),
];
