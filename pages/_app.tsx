import { AuthBindings, Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { RefineSnackbarProvider, ThemedLayoutV2, notificationProvider } from "@refinedev/mui";
import routerProvider, { UnsavedChangesNotifier } from "@refinedev/nextjs-router";
import type { NextPage } from "next";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import React from "react";

import { Header } from "@components/header";
import { ColorModeContextProvider } from "@contexts";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import dataProvider from "@refinedev/simple-rest";
import { manrope } from "src/utils/fonts";

const API_URL = "https://api.fake-rest.refine.dev";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
	noLayout?: boolean;
};

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout;
};

const App = (props: React.PropsWithChildren) => {
	const { data, status } = useSession();
	const router = useRouter();
	const { to } = router.query;

	if (status === "loading") {
		return <span>loading...</span>;
	}

	const authProvider: AuthBindings = {
		login: async () => {
			signIn("auth0", {
				callbackUrl: to ? to.toString() : "/",
				redirect: true,
			});

			return {
				success: true,
			};
		},
		logout: async () => {
			signOut({
				redirect: true,
				callbackUrl: "/login",
			});

			return {
				success: true,
			};
		},
		onError: async (error) => {
			console.error(error);
			return {
				error,
			};
		},
		check: async () => {
			if (status === "unauthenticated") {
				return {
					authenticated: false,
					redirectTo: "/login",
				};
			}

			return {
				authenticated: true,
			};
		},
		getPermissions: async () => {
			return null;
		},
		getIdentity: async () => {
			if (data?.user) {
				const { user } = data;
				return {
					name: user.name,
					avatar: user.image,
				};
			}

			return null;
		},
	};

	return (
		<>
			<RefineKbarProvider>
				<ColorModeContextProvider>
					<CssBaseline />
					<GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
					<RefineSnackbarProvider>
						<Refine
							routerProvider={routerProvider}
							dataProvider={dataProvider(API_URL)}
							notificationProvider={notificationProvider}
							authProvider={authProvider}
							resources={[
								{
									name: "blog_posts",
									list: "/blog-posts",
									create: "/blog-posts/create",
									edit: "/blog-posts/edit/:id",
									show: "/blog-posts/show/:id",
									meta: {
										canDelete: true,
									},
								},
								{
									name: "categories",
									list: "/categories",
									create: "/categories/create",
									edit: "/categories/edit/:id",
									show: "/categories/show/:id",
									meta: {
										canDelete: true,
									},
								},
							]}
							options={{
								syncWithLocation: true,
								warnWhenUnsavedChanges: true,
								useNewQueryKeys: true,
							}}
						>
							{props.children}
							<RefineKbar />
							<UnsavedChangesNotifier />
						</Refine>
					</RefineSnackbarProvider>
				</ColorModeContextProvider>
			</RefineKbarProvider>
		</>
	);
};

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppPropsWithLayout): JSX.Element {
	const renderComponent = () => {
		if (Component.noLayout) {
			return <Component {...pageProps} />;
		}

		return (
			<ThemedLayoutV2 Header={() => <Header sticky />}>
				<Component {...pageProps} />
			</ThemedLayoutV2>
		);
	};

	return (
		<>
			<style
				jsx
				global
			>
				{`
					:root {
						--font-manrope: ${manrope.style.fontFamily};
					}
				`}
			</style>
			<SessionProvider session={session}>
				<App>{renderComponent()}</App>
			</SessionProvider>
		</>
	);
}

export default MyApp;
