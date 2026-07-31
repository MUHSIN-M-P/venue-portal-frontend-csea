"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { StatCard } from "@/components/Card";
import { Table, TableCell, TableRow } from "@/components/Table";
import { Plus, Loader2, AlertCircle, Trash2, Edit } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { useFetch } from "@/hooks/useFetch";
import { cn } from "@/lib/utils";
import { formatRoleLabel, hasRole, extractRoleValues, RoleAssignment } from "@/lib/utils";

type ApiUser = {
	userId: number;
	name: string;
	email: string;
	roles?: RoleAssignment[];
	isActive: boolean;
};

export function AdminClubsPage() {
	const {
		data: clubsData,
		isLoading: isFetching,
		error: fetchError,
		sendRequest: fetchClubs,
	} = useFetch();
	const {
		isLoading: isSubmitting,
		error: submitError,
		sendRequest: saveClub,
		clearError: clearSubmitError,
	} = useFetch();
	const { sendRequest: deleteClub } = useFetch();
	const { data: usersData, sendRequest: fetchUsers } = useFetch();

	const [isOpen, setIsOpen] = useState(false);
	const [editId, setEditId] = useState<number | null>(null);

	// Form states
	const [clubName, setClubName] = useState("");
	const [secretaryUserId, setSecretaryUserId] = useState("");
	const [secretaryName, setSecretaryName] = useState("");
	const [secretaryEmail, setSecretaryEmail] = useState("");
	const [contactNumber, setContactNumber] = useState("");
	const [coordinatorId, setCoordinatorId] = useState("");

	useEffect(() => {
		fetchClubs("/api/clubs");
		fetchUsers("/api/admin/users");
	}, [fetchClubs, fetchUsers]);

	const handleOpenAdd = () => {
		clearSubmitError();
		setEditId(null);
		setClubName("");
		setSecretaryUserId("");
		setSecretaryName("");
		setSecretaryEmail("");
		setContactNumber("");
		setCoordinatorId("");
		setIsOpen(true);
	};

	const handleOpenEdit = (club: any) => {
		clearSubmitError();
		setEditId(club.clubId);
		setClubName(club.clubName);
		setSecretaryUserId(String(club.clubId));
		setSecretaryName(club.secretaryName || "");
		setSecretaryEmail(club.secretaryEmail || "");
		setContactNumber(club.contactNumber || "");
		setCoordinatorId(String(club.facultyCoordinatorId));
		setIsOpen(true);
	};

	const handleSave = async () => {
		if (
			!clubName ||
			!secretaryUserId ||
			!secretaryName ||
			!secretaryEmail ||
			!contactNumber ||
			!coordinatorId
		) {
			alert("Please fill in all required fields.");
			return;
		}

		try {
			const payload = {
				clubName,
				secretaryUserId: parseInt(secretaryUserId),
				secretaryName,
				secretaryEmail,
				contactNumber,
				facultyCoordinatorId: parseInt(coordinatorId),
			};

			if (editId) {
				await saveClub(`/api/clubs/${editId}`, {
					method: "PUT",
					body: payload,
				});
			} else {
				await saveClub("/api/clubs", {
					method: "POST",
					body: payload,
				});
			}
			setIsOpen(false);
			fetchClubs("/api/clubs");
		} catch (err) {
			console.error("Save club failed:", err);
		}
	};

	const handleDelete = async (id: number) => {
		if (confirm("Are you sure you want to delete this club?")) {
			try {
				await deleteClub(`/api/clubs/${id}`, { method: "DELETE" });
				fetchClubs("/api/clubs");
			} catch (err) {
				console.error("Delete club failed:", err);
			}
		}
	};

	const clubs = (clubsData as any)?.data || (clubsData as any)?.clubs || [];
	const stats = {
		total: clubs.length,
		active: clubs.filter((c: any) => c.isActive !== false).length,
	};

	const users = ((usersData as { users?: ApiUser[] })?.users) || [];
	const clubUsers = users.filter((u) => hasRole(extractRoleValues(u.roles), "CLUB") && u.isActive);
	const assignedClubUserIds = clubs.map((c: any) => c.clubId);
	const availableClubUsers = clubUsers.filter(
		(u: any) => !assignedClubUserIds.includes(u.userId) || u.userId === parseInt(secretaryUserId || "0"),
	);
	const availableClubOptions = availableClubUsers.map((u) => ({
		id: String(u.userId),
		label: `${u.name} (${u.email})`,
	}));

	// Filter institutional users for coordinator selection (non-club, non-admin, e.g. faculties/staffs)
	const facultyUsers = users.filter(
		(u) =>
			hasRole(extractRoleValues(u.roles), "FACULTY_COORDINATOR") ||
			hasRole(extractRoleValues(u.roles), "FACULTY_IN_CHARGE") ||
			hasRole(extractRoleValues(u.roles), "HOD") ||
			hasRole(extractRoleValues(u.roles), "STAFF_IN_CHARGE"),
	);

	const facultyOptions = facultyUsers.map((u) => ({
		id: String(u.userId),
		label: `${u.name} (${formatRoleLabel(extractRoleValues(u.roles)[0] || "")})`,
	}));

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h1 className="text-xl font-bold text-gray-800">Club Registry</h1>
					<p className="text-xs text-gray-500">
						Manage recognized student clubs and their coordinators
					</p>
				</div>
				<Button variant="primary" size="sm" onPress={handleOpenAdd} className="self-start sm:self-auto">
					<Plus className="w-4 h-4 inline mr-1" /> Add Club
				</Button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<StatCard title="Total Clubs" value={stats.total.toString()} />
				<StatCard title="Active Registry" value={stats.active.toString()} />
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
							onPress={() => fetchClubs("/api/clubs")}
						>
							Retry
						</Button>
					</div>
				) : (
					<Table
						headers={[
							"Club Name",
							"Secretary",
							"Contact",
							"Coordinator",
							"Status",
							"Actions",
						]}
					>
						{clubs.length === 0 ? (
							<TableRow>
								<TableCell className="text-center py-8 text-gray-500 italic">
									No clubs found
								</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
							</TableRow>
						) : (
							clubs.map((club: any) => (
								<TableRow key={club.clubId}>
									<TableCell className="font-bold text-gray-800">
										{club.clubName}
									</TableCell>
									<TableCell className="text-sm">
										<div className="font-medium text-gray-700">
											{club.secretaryName}
										</div>
										<div className="text-xs text-gray-400">
											{club.secretaryEmail}
										</div>
									</TableCell>
									<TableCell className="text-sm text-gray-600">
										{club.contactNumber}
									</TableCell>
									<TableCell className="text-sm">
										<div className="font-medium text-gray-700">
											{club.coordinator?.name || "Unknown"}
										</div>
										<div className="text-xs text-gray-400">
											ID: {club.facultyCoordinatorId}
										</div>
									</TableCell>
									<TableCell>
										<span
											className={cn(
												"px-2 py-0.5 rounded-full text-[10px] font-bold border",
												club.isActive !== false
													? "bg-green-50 text-green-700 border-green-200"
													: "bg-gray-50 text-gray-500 border-gray-200",
											)}
										>
											{club.isActive !== false ? "ACTIVE" : "INACTIVE"}
										</span>
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												onPress={() => handleOpenEdit(club)}
											>
												<Edit className="w-3.5 h-3.5" />
											</Button>
											<Button
												size="sm"
												variant="danger"
												onPress={() => handleDelete(club.clubId)}
											>
												<Trash2 className="w-3.5 h-3.5" />
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
				title={editId ? "Edit Club" : "Add New Club"}
			>
				<div className="space-y-4 p-1">
					{submitError && (
						<div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
							<AlertCircle className="w-4 h-4 shrink-0" />
							<span>{submitError}</span>
						</div>
					)}
					<Input
						label="Club Name"
						value={clubName}
						onChange={(e) => setClubName((e.target as HTMLInputElement).value)}
						placeholder="e.g. CSEA"
					/>
					<Select
						label="Club Secretary Account"
						selectedKey={secretaryUserId}
						onSelectionChange={(key) => {
							setSecretaryUserId(key);
							const selectedUser = users.find((u: any) => String(u.userId) === key);
							if (selectedUser) {
								setSecretaryName(selectedUser.name);
								setSecretaryEmail(selectedUser.email);
							} else {
								setSecretaryName("");
								setSecretaryEmail("");
							}
						}}
						options={availableClubOptions}
						placeholder="Select secretary account"
					/>
					{secretaryUserId && (
						<>
							<Input
								label="Secretary Name"
								value={secretaryName}
								disabled
								placeholder="Secretary Name"
							/>
							<Input
								label="Secretary Email"
								value={secretaryEmail}
								disabled
								placeholder="Secretary Email"
							/>
						</>
					)}
					<Input
						label="Contact Number"
						value={contactNumber}
						onChange={(e) =>
							setContactNumber((e.target as HTMLInputElement).value)
						}
						placeholder="10-digit mobile number"
					/>

					<Select
						label="Faculty Coordinator"
						selectedKey={coordinatorId}
						onSelectionChange={(key) => setCoordinatorId(key)}
						options={facultyOptions}
						placeholder="Select faculty coordinator"
					/>

					<div className="flex gap-3 pt-4">
						<Button
							variant="primary"
							className="flex-1"
							onPress={handleSave}
							isDisabled={isSubmitting}
						>
							{isSubmitting ? (
								<Loader2 className="w-4 h-4 animate-spin mr-2" />
							) : null}
							{editId ? "Update Club" : "Create Club"}
						</Button>
						<Button
							variant="outline"
							className="flex-1"
							onPress={() => setIsOpen(false)}
						>
							Cancel
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
