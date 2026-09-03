"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Card, StatCard } from "@/components/Card";
import { Table, TableRow, TableCell } from "@/components/Table";
import { cn } from "@/lib/utils";
import { extractRoleValues, hasRole, RoleAssignment } from "@/lib/utils";
import { useFetch } from "@/hooks/useFetch";
import { Loader2 } from "lucide-react";
import { Switch } from "react-aria-components";
import { AdminVenuesPage } from "./AdminVenuesPage";
import { AdminClubsPage } from "./AdminClubsPage";
import { AdminPeoplePage } from "./AdminPeoplePage";

// Shape of a user returned by GET /api/admin/users
type ApiUser = {
	userId: number;
	email: string;
	name: string;
	roles?: RoleAssignment[];
	profilePicture: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

type UsersResponse = {
	users: ApiUser[];
};

type AuditLogEntry = {
	logId: number;
	createdAt?: string;
	timestamp?: string;
	action?: string;
	target?: string;
	details?: string;
	remarks?: string;
	booking?: {
		eventName?: string;
	};
	actor?: {
		name?: string;
		email?: string;
	};
};

type AdminDashboardProps = {
	activeSection?: string;
};

export function AdminDashboard({
	activeSection = "overview",
}: AdminDashboardProps) {
	// ── Users data (fetched once for the overview stats) ───────────────────
	const {
		data: usersData,
		isLoading: isLoadingUsers,
		sendRequest: fetchUsers,
	} = useFetch<UsersResponse>();

	// ── Audit logs data (fetched when audit section is active) ─────────────
	const {
		data: auditLogsData,
		isLoading: isFetchingLogs,
		sendRequest: fetchLogs,
	} = useFetch();

	const [hodApprovalRequired, setHodApprovalRequired] = useState(true);

	// Fetch users on mount (needed for the overview stat cards)
	useEffect(() => {
		fetchUsers("/api/admin/users").catch(() => {
			// error already captured in useFetch state
		});
	}, [fetchUsers]);

	// Fetch audit logs only when that section is active
	useEffect(() => {
		if (activeSection === "audit") {
			fetchLogs("/api/logs").catch(() => { });
		}
	}, [activeSection, fetchLogs]);

	// ── Derive stats from the user list ────────────────────────────────────
	const users: ApiUser[] = usersData?.users ?? [];

	const totalUsers = users.length;
	const activeFaculty = users.filter(
		(u) =>
			u.isActive &&
			(hasRole(extractRoleValues(u.roles), "FACULTY_IN_CHARGE") ||
				hasRole(extractRoleValues(u.roles), "FACULTY_COORDINATOR") ||
				hasRole(extractRoleValues(u.roles), "HOD")),
	).length;
	const activeStaff = users.filter(
		(u) => u.isActive && hasRole(extractRoleValues(u.roles), "STAFF_IN_CHARGE"),
	).length;

	const logs = ((auditLogsData as { data?: AuditLogEntry[] })?.data) || [];

	// ── Loading placeholder for stat values ────────────────────────────────
	const statVal = (val: number) => (isLoadingUsers ? "…" : String(val));

	const renderContent = () => {
		switch (activeSection) {
			case "overview":
				return (
					<div className="space-y-6">
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
							<h1 className="text-2xl font-bold text-gray-800">
								System Overview
							</h1>
							<div className="text-sm text-gray-600">
								Welcome, <span className="font-semibold">Administrator</span>
							</div>
						</div>

						{/* ── Stat cards ─────────────────────────────────────────────── */}
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
							<StatCard title="Total Users" value={statVal(totalUsers)} />
							<StatCard title="Active Faculty" value={statVal(activeFaculty)} />
							<StatCard title="Active Staff" value={statVal(activeStaff)} />
							<StatCard title="Pending Requests" value='12' />
						</div>

						
						{/* ── System status ───────────────────────────────────────────── */}
						<Card className="p-5">
							<h2 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">
								System Status
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
								<div>
									<h3 className="font-semibold text-gray-700 mb-2.5">
										Services Status
									</h3>
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<span>SSO Authentication</span>
											<span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
												Operational
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span>Email Notifications</span>
											<span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
												Operational
											</span>
										</div>
									</div>
								</div>

								<div>
									<h3 className="font-semibold text-gray-700 mb-2.5">
										Active Users
									</h3>
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<span>Active accounts</span>
											<span className="font-semibold text-primary">
												{isLoadingUsers
													? "…"
													: `${users.filter((u) => u.isActive).length} / ${totalUsers}`}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span>Inactive accounts</span>
											<span className="font-semibold text-gray-500">
												{isLoadingUsers
													? "…"
													: String(users.filter((u) => !u.isActive).length)}
											</span>
										</div>
									</div>
								</div>
							</div>
						</Card>
					</div>
				);

			case "users":
				return <AdminPeoplePage />;

			case "audit":
				return (
					<div className="space-y-6">
						<div>
							<h1 className="text-2xl font-bold text-gray-800">
								System Audit Logs
							</h1>
							<p className="text-sm text-gray-500">
								Traceable history of all booking actions and system changes
							</p>
						</div>

						<Card className="p-0 overflow-hidden">
							{isFetchingLogs ? (
								<div className="flex justify-center py-12">
									<Loader2 className="w-10 h-10 animate-spin text-accent" />
								</div>
							) : (
								<Table
									headers={["Timestamp", "User", "Action", "Target", "Details"]}
								>
									{logs.length === 0 ? (
										<TableRow>
											<TableCell className="text-center py-8 text-gray-500 italic">
												No logs found
											</TableCell>
											<TableCell>-</TableCell>
											<TableCell>-</TableCell>
											<TableCell>-</TableCell>
											<TableCell>-</TableCell>
										</TableRow>
									) : (
										logs.map((log) => (
											<TableRow key={log.logId}>
												<TableCell className="text-xs whitespace-nowrap">
													{new Date(log.createdAt || log.timestamp || Date.now()).toLocaleString()}
												</TableCell>
												<TableCell>
													<div className="text-xs font-semibold">
														{log.actor?.name}
													</div>
													<div className="text-[10px] text-gray-500">
														{log.actor?.email}
													</div>
												</TableCell>
												<TableCell>
													<span
														className={cn(
															"px-2 py-0.5 rounded text-[10px] font-bold border",
															log.action === "APPROVED" &&
															"bg-green-50 text-green-700 border-green-200",
															log.action === "REJECTED" &&
															"bg-red-50 text-red-700 border-red-200",
															log.action === "SUBMITTED" &&
															"bg-blue-50 text-blue-700 border-blue-200",
															log.action === "FORWARDED" &&
															"bg-amber-50 text-amber-700 border-amber-200",
														)}
													>
														{log.action}
													</span>
												</TableCell>
												<TableCell className="text-xs font-medium">
													{log.booking?.eventName || "System"}
												</TableCell>
												<TableCell className="text-xs text-gray-600 italic">
													{log.remarks || "-"}
												</TableCell>
											</TableRow>
										))
									)}
								</Table>
							)}
						</Card>
					</div>
				);

			case "venues":
				return <AdminVenuesPage />;
			case "clubs":
				return <AdminClubsPage />;
			case "settings":
			case "config":
				return (
					<div className="space-y-6">
						<div>
							<h1 className="text-2xl font-bold text-gray-800">
								System Settings
							</h1>
							<p className="text-sm text-gray-500">
								Configure global portal parameters and approval workflows
							</p>
						</div>
						<Card className="p-5">
							<h2 className="text-base font-semibold text-gray-800 mb-3">
								Approval Configuration
							</h2>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-sm font-semibold text-gray-800">
											HOD Approval Required
										</h3>
										<p className="text-xs text-text-muted mt-0.5">
											Require final approval from the Head of Department for
											booking requests
										</p>
									</div>
									<Switch
										isSelected={hodApprovalRequired}
										onChange={setHodApprovalRequired}
										className={({ isSelected }) =>
											cn(
												"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
												isSelected ? "bg-accent" : "bg-gray-200",
											)
										}
									>
										{({ isSelected }) => (
											<span
												className={cn(
													"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
													isSelected ? "translate-x-5" : "translate-x-0",
												)}
											/>
										)}
									</Switch>
								</div>

								<div className="pt-4 border-t border-gray-100 flex justify-end">
									<Button
										onPress={() => alert("Configuration saved")}
										variant="primary"
									>
										Save Changes
									</Button>
								</div>
							</div>
						</Card>
					</div>
				);
			default:
				return null;
		}
	};

	return <div className="w-full space-y-4 sm:space-y-6">{renderContent()}</div>;
}
