import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabItem = {
	id: string;
	label: string;
	icon: any;
	description?: string;
};

export default function AdminTabsList({ tabs }: { tabs: TabItem[] }) {
	return (
		<TabsList className="grid w-full grid-cols-5 lg:grid-cols-8 mb-8 bg-yellow-300">
			{tabs.map((tab) => (
				<TabsTrigger
					key={tab.id}
					value={tab.id}
					className="flex items-center gap-1"
				>
					<tab.icon className="w-4 h-4" />
					{tab.label}
				</TabsTrigger>
			))}
		</TabsList>
	);
}
