"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { StatCard } from "@/components/Card";
import { Table, TableCell, TableRow } from "@/components/Table";
import { Plus, Loader2, AlertCircle, Trash2, Edit, ChevronRight, ChevronDown } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { useFetch } from "@/hooks/useFetch";
import { cn } from "@/lib/utils";
import { hasRole, formatRoleLabel, extractRoleValues, RoleAssignment } from "@/lib/utils";

type ApiUser = {
	userId: number;
	name: string;
	email: string;
	roles?: RoleAssignment[];
	isActive: boolean;
};

export function AdminVenuesPage() {
	const {
		data: venuesData,
		isLoading: isFetching,
		error: fetchError,
		sendRequest: fetchVenues,
	} = useFetch();
	const { isLoading: isSubmitting, error: submitError, sendRequest: saveVenue, clearError: clearSubmitError } = useFetch();
	const { sendRequest: deleteVenue } = useFetch();
	const { data: usersData, sendRequest: fetchUsers } = useFetch();
	const { isLoading: isHandlerAction, sendRequest: runHandlerAction } = useFetch();

	const [isOpen, setIsOpen] = useState(false);
	const [editId, setEditId] = useState<number | null>(null);

	// Form states
	const [name, setName] = useState("");
	const [venueType, setVenueType] = useState("HALL");
	const [location, setLocation] = useState("");
	const [capacity, setCapacity] = useState("");
	const [isAvailable, setIsAvailable] = useState(true);
	const [selectedHandlers, setSelectedHandlers] = useState<{ handlerId: number; name: string; role: string }[]>([]);

	// Handlers expansion & inline assignment states
	const [expandedVenueIds, setExpandedVenueIds] = useState<number[]>([]);
	const [handlerFormState, setHandlerFormState] = useState<Record<number, string>>({});

	useEffect(() => {
		fetchVenues("/api/admin/venues");
		fetchUsers("/api/admin/users");
	}, [fetchVenues, fetchUsers]);

	const handleOpenAdd = () => {
		clearSubmitError();
		setEditId(null);
		setName("");
		setVenueType("HALL");
		setLocation("");
		setCapacity("");
		setIsAvailable(true);
		setSelectedHandlers([]);
		setIsOpen(true);
	};

	const handleOpenEdit = (venue: any) => {
		clearSubmitError();
		setEditId(venue.venueId);
		setName(venue.name);
		setVenueType(venue.venueType);
		setLocation(venue.location);
		setCapacity(String(venue.capacity));
		setIsAvailable(venue.isAvailable);
		setIsOpen(true);
	};

	const handleSave = async () => {
		if (!name || !location || !capacity) {
			alert("Please fill in all required fields.");
			return;
		}

		if (!editId && selectedHandlers.length === 0) {
			alert("Please select at least one venue handler.");
			return;
		}

		try {
			const payload = {
				name,
				venueType,
				location,
				capacity: parseInt(capacity) || 0,
				isAvailable,
			};

			if (editId) {
				await saveVenue(`/api/admin/venues/${editId}`, {
					method: "PUT",
					body: payload,
				});
			} else {
				await saveVenue("/api/admin/venues", {
					method: "POST",
					body: {
						...payload,
						handlers: selectedHandlers.map((h) => ({
							handlerId: h.handlerId,
							role: h.role,
						})),
					},
				});
			}
			setIsOpen(false);
			fetchVenues("/api/admin/venues");
		} catch (err) {
			console.error("Save venue failed:", err);
		}
	};

	const handleDelete = async (id: number) => {
		if (confirm("Are you sure you want to delete this venue?")) {
			try {
				await deleteVenue(`/api/admin/venues/${id}`, { method: "DELETE" });
				fetchVenues("/api/admin/venues");
			} catch (err) {
				console.error("Delete venue failed:", err);
			}
		}
	};

	// Inline Handlers logic
	const toggleVenueExpansion = (venueId: number) => {
		setExpandedVenueIds((prev) =>
			prev.includes(venueId) ? prev.filter((id) => id !== venueId) : [...prev, venueId]
		);
	};

	const handleAddHandlerInline = async (venueId: number) => {
		const handlerId = handlerFormState[venueId];
		if (!handlerId) return;

		const selectedUserObj = users.find((u: any) => String(u.userId) === handlerId);
		if (!selectedUserObj) return;
		const userRoles = extractRoleValues(selectedUserObj.roles);
		const handlerRole = userRoles.includes("STAFF_IN_CHARGE")
			? "STAFF_IN_CHARGE"
			: "FACULTY_IN_CHARGE";

		try {
			await runHandlerAction(`/api/admin/venues/${venueId}/handlers`, {
				method: "POST",
				body: {
					handlerId: parseInt(handlerId),
					role: handlerRole,
				},
			});
			setHandlerFormState((prev) => ({ ...prev, [venueId]: "" }));
			fetchVenues("/api/admin/venues");
		} catch (err) {
			console.error("Add handler failed:", err);
		}
	};

	const handleRemoveHandlerInline = async (venueId: number, handlerId: number) => {
		try {
			await runHandlerAction(`/api/admin/venues/${venueId}/handlers/${handlerId}`, {
				method: "DELETE",
			});
			fetchVenues("/api/admin/venues");
		} catch (err) {
			console.error("Remove handler failed:", err);
		}
	};

	const venues = (venuesData as any)?.venues || [];
	const stats = {
		total: venues.length,
		available: venues.filter((v: any) => v.isAvailable).length,
		unavailable: venues.filter((v: any) => !v.isAvailable).length,
	};

	const users = ((usersData as { users?: ApiUser[] })?.users) || [];

	const getAssignableUsers = (venue: any) => {
		const assignedHandlerIds = venue?.handlers?.map((h: any) => h.handlerId) || [];
		return users.filter((u) => {
			const uRoles = extractRoleValues(u.roles || (u as any).role);
			const isEligible = uRoles.includes("STAFF_IN_CHARGE") || uRoles.includes("FACULTY_IN_CHARGE");
			return isEligible && u.isActive && !assignedHandlerIds.includes(u.userId);
		});
	};

	const assignableModalUsers = users.filter((u) => {
		const uRoles = extractRoleValues(u.roles || (u as any).role);
		const isEligible = uRoles.includes("STAFF_IN_CHARGE") || uRoles.includes("FACULTY_IN_CHARGE");
		return isEligible && u.isActive && !selectedHandlers.some((sh) => sh.handlerId === u.userId);
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h1 className="text-xl font-bold text-gray-800">Venue Management</h1>
					<p className="text-xs text-gray-500">
						Configure department halls, labs, and classrooms
					</p>
				</div>
				<Button variant="primary" size="sm" onPress={handleOpenAdd} className="self-start sm:self-auto">
					<Plus className="w-4 h-4 inline mr-1" /> Add Venue
				</Button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<StatCard title="Total Venues" value={stats.total.toString()} />
				<StatCard title="Available" value={stats.available.toString()} />
				<StatCard
					title="Unavailable"
					value={stats.unavailable.toString()}
					variant="danger"
				/>
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
							onPress={() => fetchVenues("/api/admin/venues")}
						>
							Retry
						</Button>
					</div>
				) : (
					<Table
						headers={[
							"", // Chevron column
							"Name",
							"Type",
							"Location",
							"Capacity",
							"Handlers",
							"Status",
							"Actions",
						]}
					>
						{venues.length === 0 ? (
							<TableRow>
								<TableCell className="text-center py-8 text-gray-500 italic">
									No venues found
								</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
								<TableCell>-</TableCell>
							</TableRow>
						) : (
							venues.map((venue: any) => {
								const isExpanded = expandedVenueIds.includes(venue.venueId);
								const staffCount = venue.handlers?.filter((h: any) => h.role === "STAFF_IN_CHARGE").length || 0;
								const facultyCount = venue.handlers?.filter((h: any) => h.role === "FACULTY_IN_CHARGE").length || 0;
								const assignable = getAssignableUsers(venue);

								return (
									<React.Fragment key={venue.venueId}>
										<TableRow>
											<TableCell className="w-10 text-center">
												<button
													onClick={() => toggleVenueExpansion(venue.venueId)}
													className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors focus:outline-none"
												>
													{isExpanded ? (
														<ChevronDown className="w-4 h-4" />
													) : (
														<ChevronRight className="w-4 h-4" />
													)}
												</button>
											</TableCell>
											<TableCell className="font-bold text-gray-800">
												{venue.name}
											</TableCell>
											<TableCell>
												<span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">
													{venue.venueType}
												</span>
											</TableCell>
											<TableCell className="text-sm">{venue.location}</TableCell>
											<TableCell className="text-sm font-medium">
												{venue.capacity}
											</TableCell>
											<TableCell className="text-xs font-semibold text-gray-600">
												<span className="inline-flex gap-1.5">
													<span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
														{facultyCount} Faculty
													</span>
													<span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
														{staffCount} Staff
													</span>
												</span>
											</TableCell>
											<TableCell>
												<span
													className={cn(
														"px-2 py-0.5 rounded-full text-[10px] font-bold border",
														venue.isAvailable
															? "bg-green-50 text-green-700 border-green-200"
															: "bg-red-50 text-red-700 border-red-200",
													)}
												>
													{venue.isAvailable ? "AVAILABLE" : "MAINTENANCE"}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex gap-2">
													<Button
														size="sm"
														variant="outline"
														onPress={() => handleOpenEdit(venue)}
													>
														<Edit className="w-3.5 h-3.5" />
													</Button>
													<Button
														size="sm"
														variant="danger"
														onPress={() => handleDelete(venue.venueId)}
													>
														<Trash2 className="w-3.5 h-3.5" />
													</Button>
												</div>
											</TableCell>
										</TableRow>

										{isExpanded && (
											<TableRow>
												<TableCell colSpan={8} className="bg-gray-50/50 p-6 border-t border-b border-gray-100">
													<div className="w-full space-y-4">
														<div className="flex flex-col gap-4 border-b border-gray-150 pb-3">
															<div>
																<h4 className="text-sm font-bold text-gray-800">
																	Manage Handlers
																</h4>
																<p className="text-xs text-gray-500">
																	Assign or remove staff and faculty coordinators.
																</p>
															</div>

															{/* Inline Assign Input */}
															<div className="flex flex-col sm:flex-row gap-2 sm:items-end">
																<div className="w-full sm:w-72">
																	<Select
																		label="Assign New Handler"
																		isDisabled={assignable.length === 0}
																		selectedKey={handlerFormState[venue.venueId] || ""}
																		onSelectionChange={(key) =>
																			setHandlerFormState((prev) => ({
																				...prev,
																				[venue.venueId]: key as string,
																			}))
																		}
																		placeholder={assignable.length > 0 ? "Choose a user to assign..." : "No available users to select"}
																		options={assignable.map((u) => {
																			const rLabels = extractRoleValues(u.roles || (u as any).role).map(formatRoleLabel).join(", ");
																			return {
																				id: String(u.userId),
																				label: `${u.name}${rLabels ? ` (${rLabels})` : ""}`,
																			};
																		})}
																	/>
																</div>
																<Button
																	variant="primary"
																	onPress={() => handleAddHandlerInline(venue.venueId)}
																	isDisabled={!handlerFormState[venue.venueId] || isHandlerAction || assignable.length === 0}
																	className="h-[38px] px-4 text-xs w-full sm:w-auto"
																>
																	{isHandlerAction ? (
																		<Loader2 className="w-3.5 h-3.5 animate-spin" />
																	) : (
																		"Assign"
																	)}
																</Button>
															</div>
														</div>

														<div>
															{!venue.handlers || venue.handlers.length === 0 ? (
																<p className="text-sm text-gray-500 italic py-4 text-center">
																	No handlers assigned to this venue.
																</p>
															) : (
																<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
																	{venue.handlers.map((h: any) => (
																		<div
																			key={h.id}
																			className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-150 text-xs shadow-sm"
																		>
																			<div>
																				<div className="flex items-center gap-2">
																					<span className="font-semibold text-gray-700">
																						{h.user?.name}
																					</span>
																					<span className={cn(
																						"text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase border",
																						h.role === "STAFF_IN_CHARGE"
																							? "bg-blue-50 text-blue-700 border-blue-200"
																							: "bg-amber-50 text-amber-700 border-amber-200"
																					)}>
																						{h.role === "STAFF_IN_CHARGE" ? "Staff" : "Faculty"}
																					</span>
																				</div>
																				<span className="text-gray-400 block mt-0.5">
																					{h.user?.email}
																				</span>
																			</div>
																			<Button
																				size="sm"
																				variant="danger"
																				className="p-1.5 min-w-0 ml-2"
																				onPress={() =>
																					handleRemoveHandlerInline(venue.venueId, h.handlerId)
																				}
																				isDisabled={isHandlerAction}
																			>
																				<Trash2 className="w-3.5 h-3.5" />
																			</Button>
																		</div>
																	))}
																</div>
															)}
														</div>
													</div>
												</TableCell>
											</TableRow>
										)}
									</React.Fragment>
								);
							})
						)}
					</Table>
				)}
			</div>

			{/* Create/Edit Venue Details Modal */}
			<Modal
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				title={editId ? "Edit Venue" : "Add New Venue"}
			>
				<div className="space-y-4 p-1">
					{submitError && (
						<div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
							<AlertCircle className="w-4 h-4 shrink-0" />
							<span>{submitError}</span>
						</div>
					)}
					<Input
						label="Venue Name"
						value={name}
						onChange={(e) => setName((e.target as HTMLInputElement).value)}
						placeholder="e.g. APJ Hall"
					/>
					<Select
						label="Venue Type"
						selectedKey={venueType}
						onSelectionChange={(key) => setVenueType(key as string)}
						options={[
							{ id: "HALL", label: "Hall" },
							{ id: "LAB", label: "Lab" },
							{ id: "CLASSROOM", label: "Classroom" },
						]}
					/>
					<Input
						label="Location"
						value={location}
						onChange={(e) => setLocation((e.target as HTMLInputElement).value)}
						placeholder="Building, Floor"
					/>
					<Input
						label="Capacity"
						type="number"
						value={capacity}
						onChange={(e) => setCapacity((e.target as HTMLInputElement).value)}
						placeholder="Number of seats"
					/>
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="isAvailable"
							checked={isAvailable}
							onChange={(e) => setIsAvailable(e.target.checked)}
							className="w-4 h-4 text-accent rounded focus:ring-accent"
						/>
						<label
							htmlFor="isAvailable"
							className="text-sm font-medium text-gray-700 cursor-pointer"
						>
							Venue is available for booking
						</label>
					</div>

					{!editId && (
						<div className="space-y-2 border-t border-gray-100 pt-4">
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500">
								Venue Handlers (At least one required)
							</label>
							
							{selectedHandlers.length > 0 ? (
								<div className="flex flex-wrap gap-2 mb-2">
									{selectedHandlers.map((h) => (
										<div
											key={h.handlerId}
											className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 text-xs"
										>
											<span className="font-semibold text-gray-700">
												{h.name} ({h.role === "STAFF_IN_CHARGE" ? "Staff" : "Faculty"})
											</span>
											<button
												type="button"
												onClick={() => setSelectedHandlers((prev) => prev.filter((sh) => sh.handlerId !== h.handlerId))}
												className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none font-bold text-sm"
											>
												&times;
											</button>
										</div>
									))}
								</div>
							) : (
								<div className="text-xs text-red-500 font-medium italic mb-2">
									No handlers selected yet. At least one is required.
								</div>
							)}

							<Select
								placeholder="Select a handler to add..."
								options={assignableModalUsers.map((u) => ({
									id: String(u.userId),
									label: `${u.name} (${hasRole(extractRoleValues(u.roles), "STAFF_IN_CHARGE") ? "Staff" : formatRoleLabel(extractRoleValues(u.roles)[0] || "FACULTY_IN_CHARGE")})`,
								}))}
								onSelectionChange={(key) => {
									const selectedUserObj = users.find((u: any) => String(u.userId) === key);
									if (selectedUserObj) {
									const userRoles = selectedUserObj.roles || [];
									const selectedRole = hasRole(extractRoleValues(userRoles), "STAFF_IN_CHARGE")
										? "STAFF_IN_CHARGE"
										: "FACULTY_IN_CHARGE";
										setSelectedHandlers((prev) => {
											if (prev.some((sh) => sh.handlerId === selectedUserObj.userId)) return prev;
											return [
												...prev,
												{
													handlerId: selectedUserObj.userId,
													name: selectedUserObj.name,
												role: selectedRole,
												},
											];
										});
									}
								}}
							/>
						</div>
					)}

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
							{editId ? "Update Venue" : "Create Venue"}
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
