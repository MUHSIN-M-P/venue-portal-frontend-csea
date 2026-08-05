"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { StatCard } from "@/components/Card";
import {
	Table,
	TableCell,
	TableRow,
	StatusBadge,
	RoleBadge,
} from "@/components/Table";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { RoleSelector } from "@/components/RoleSelector";
import { useFetch } from "@/hooks/useFetch";
import { formatRoleLabel, ROLE_OPTIONS, hasRole, extractRoleValues, RoleAssignment } from "@/lib/utils";

type ApiUser = {
	userId: number;
	name: string;
	email: string;
	roles?: RoleAssignment[];
	isActive: boolean;
};

export function AdminPeoplePage() {
	const {
		data: usersData,
		isLoading: isFetching,
		error: fetchError,
		sendRequest: fetchUsers,
	} = useFetch();
	const {
		isLoading: isSubmitting,
		error: submitError,
		sendRequest: saveUser,
	} = useFetch();
	const { sendRequest: deleteUser } = useFetch();

	const [isOpen, setIsOpen] = useState(false);
	const [editId, setEditId] = useState<number | null>(null);

	// Form states
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [roles, setRoles] = useState<string[]>(["FACULTY_IN_CHARGE"]);
	const [status, setStatus] = useState("available");

	useEffect(() => {
		fetchUsers("/api/admin/users");
	}, [fetchUsers]);

	const handleOpenAdd = () => {
		setEditId(null);
		setName("");
		setEmail("");
		setRoles(["FACULTY_IN_CHARGE"]);
		setStatus("available");
		setIsOpen(true);
	};

	const handleOpenEdit = (user: ApiUser) => {
		const rawRoles = user.roles || (user as any).role;
		const extractedRoles = extractRoleValues(rawRoles);
		setEditId(user.userId);
		setName(user.name);
		setEmail(user.email);
		setRoles(extractedRoles);
		setStatus(user.isActive ? "available" : "unavailable");
		setIsOpen(true);
	};

	const handleSave = async () => {
		if (!name || !email) {
			alert("Please fill in all required fields.");
			return;
		}

		try {
			const payload = {
				name,
				email,
				roles,
				isActive: status === "available",
			};

			if (editId) {
				await saveUser(`/api/admin/users/${editId}`, {
					method: "PUT",
					body: {
						name: payload.name,
						roles: payload.roles,
						isActive: payload.isActive,
					},
				});
			} else {
				await saveUser("/api/admin/users", {
					method: "POST",
					body: payload,
				});
			}
			setIsOpen(false);
			fetchUsers("/api/admin/users");
		} catch (err) {
			console.error("Save user failed:", err);
		}
	};

	const handleDelete = async (userId: number) => {
		if (confirm("Are you sure you want to remove this user?")) {
			try {
				await deleteUser(`/api/admin/users/${userId}`, { method: "DELETE" });
				fetchUsers("/api/admin/users");
			} catch (err) {
				console.error("Delete user failed:", err);
			}
		}
	};

	const users = ((usersData as { users?: ApiUser[] })?.users) || [];
	const totalUsers = users.length;
	const clubCount = users.filter((u) => hasRole(extractRoleValues(u.roles), "CLUB")).length;
	const facultyCount = users.filter(
		(u) =>
			hasRole(extractRoleValues(u.roles), "FACULTY_COORDINATOR") ||
			hasRole(extractRoleValues(u.roles), "FACULTY_IN_CHARGE") ||
			hasRole(extractRoleValues(u.roles), "HOD"),
	).length;
	const staffCount = users.filter(
		(u) => hasRole(extractRoleValues(u.roles), "STAFF_IN_CHARGE"),
	).length;
	const adminCount = users.filter((u) => hasRole(extractRoleValues(u.roles), "ADMIN")).length;

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h1 className="text-xl font-bold text-gray-800">User Management</h1>
					<p className="text-xs text-gray-500">
						Configure roles and permissions for system users
					</p>
				</div>
				<Button variant="outline" size="sm" onPress={handleOpenAdd} className="self-start sm:self-auto">
					<Plus className="w-4 h-4 inline mr-1" /> Add User
				</Button>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
				<StatCard title="Total Users" value={String(totalUsers)} />
				<StatCard title="Clubs" value={String(clubCount)} />
				<StatCard title="Faculty" value={String(facultyCount)} />
				<StatCard title="Staff" value={String(staffCount)} />
				<StatCard title="Admins" value={String(adminCount)} />
			</div>

			<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
				{isFetching ? (
					<div className="flex justify-center py-12">
						<Loader2 className="w-10 h-10 animate-spin text-accent" />
					</div>
				) : fetchError ? (
					<div className="p-6 text-center text-red-600 flex flex-col items-center gap-2">
						<AlertCircle className="w-10 h-10" />
						<p>{fetchError}</p>
						<Button
							variant="outline"
							size="sm"
							onPress={() => fetchUsers("/api/admin/users")}
						>
							Retry
						</Button>
					</div>
				) : (
					<Table headers={["Name", "Email", "Role", "Status", "Actions"]}>
						{users.length === 0 ? (
							<TableRow>
								<TableCell className="text-center py-8 text-gray-500 italic">
									No users found
								</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
								<TableRow key={user.userId}>
									<TableCell className="font-semibold text-gray-800">
										{user.name}
									</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<RoleBadge role={extractRoleValues(user.roles || (user as any).role)} />
									</TableCell>
									<TableCell>
										<StatusBadge
											status={user.isActive ? "available" : "unavailable"}
										/>
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												onPress={() => handleOpenEdit(user)}
											>
												Edit
											</Button>
											<Button
												size="sm"
												variant="danger"
												onPress={() => handleDelete(user.userId)}
											>
												Delete
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</Table>
				)}
			</div>

			<Modal
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				title={editId ? "Edit User Info" : "Add New User"}
			>
				<div className="space-y-4">
					{submitError && (
						<div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
							<AlertCircle className="w-4 h-4 shrink-0" />
							<span>{submitError}</span>
						</div>
					)}
					<Input
						label="Name"
						value={name}
						onChange={(e) => setName((e.target as HTMLInputElement).value)}
						placeholder="e.g. Mr. Vinod Pathari"
					/>
					<Input
						label="Email"
						type="email"
						value={email}
						onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
						placeholder="e.g. pathari@nitc.ac.in"
						disabled={editId !== null}
					/>
					<div className="space-y-2">
						<p className="text-xs font-bold uppercase tracking-wider text-text-muted">Roles</p>
						<RoleSelector
							currentRoles={roles}
							onRoleChange={(newRoles) => setRoles(newRoles)}
						/>
					</div>
					<Select
						label="Status"
						selectedKey={status}
						onSelectionChange={(key) => setStatus(String(key))}
						options={[
							{ id: "available", label: "Active" },
							{ id: "unavailable", label: "Inactive" },
						]}
					/>
					<div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
						<Button variant="outline" onPress={() => setIsOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="primary"
							onPress={handleSave}
							isDisabled={isSubmitting}
						>
							{isSubmitting && (
								<Loader2 className="w-4 h-4 animate-spin mr-2" />
							)}
							Save
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
