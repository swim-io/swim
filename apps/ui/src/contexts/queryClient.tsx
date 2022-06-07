import type { ReactElement, ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider as ReactQueryClientProvider,
} from "react-query";
// eslint-disable-next-line import/extensions
import { ReactQueryDevtools } from "react-query/devtools";

import { captureException } from "../errors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      onError: (err) => {
        console.error(err);
      },
    },
    mutations: {
      onError: (err: unknown) => {
        captureException(err);
      },
    },
  },
});

export const QueryClientProvider = ({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement => {
  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </ReactQueryClientProvider>
  );
};
