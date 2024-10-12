import { json, type LoaderFunction, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { validateSession } from "~/lib/session.server";
import { trpc } from "~/lib/trpc";

export const meta: MetaFunction = () => {
	return [
		{ title: "Remix Express Template" },
		{ name: "description", content: "Remix Express Template" },
	];
};

export const loader: LoaderFunction = async (args) => {
	await validateSession(args);

	return json({
		user: args.context.user,
	});
};

export default function Index() {
	const data = useLoaderData<typeof loader>();
	const userQuery = trpc.getUser.useQuery({ id: "1" });

	return (
		<div className="m-4">
			<h2 className="text-xl font-bold my-2">Remix Express Template</h2>
			<p>{data.message}</p>
			<p>
				You are logged in as {data.user?.name}. {userQuery?.data?.name}
			</p>
			<p>
				<a href="/signout" className="underline">
					Sign out here
				</a>
			</p>
		</div>
	);
}
