"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Card, StatCard } from "@/components/Card";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { TextArea } from "@/components/TextArea";
import { Tabs, TabPanelComponent } from "@/components/Tabs";
import { Table, TableCell, TableRow, StatusBadge } from "@/components/Table";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { Booking } from "@/types";
import { useFetch } from "@/hooks/useFetch";

export function ClubDashboardPage() {
	const [bookings, setBookings] = useState<Booking[]>([]);
	const { sendRequest: getBookings, isLoading: isLoadingBookings } = useFetch();
	const { sendRequest: addBooking, isLoading: isLoadingAddBooking } =
		useFetch();
	const { data: venuesRes, sendRequest: fetchVenues } = useFetch<{
		success: boolean;
		venues: any[];
	}>();

	const [eventName, setEventName] = useState("");
	const [venue, setVenue] = useState("0");
	const [description, setDescription] = useState("");

	// Selected schedule state populated by AvailabilityGrid
	const [startISO, setStartISO] = useState("2026-08-02T00:00:00.000Z");
	const [endISO, setEndISO] = useState("");
	const [selectedRangeText, setSelectedRangeText] = useState(
		"No date or time range selected. Click on the availability grid below to choose a time.",
	);
	const [submitCount, setSubmitCount] = useState(0);

	const loadBookings = async () => {
		try {
			const bookingsRes: any = await getBookings("/api/bookings?role=CLUB"); // Remove the role filter to get all bookings
			if (bookingsRes && bookingsRes.success) {
				const formatDate = (dateStr: string) => {
					const d = new Date(dateStr);
					const pad = (n: number) => String(n).padStart(2, "0");
					return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
				};

				const formatOnlyDate = (dateStr: string) => {
					const d = new Date(dateStr);
					const pad = (n: number) => String(n).padStart(2, "0");
					return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
				};

				const mapped = (bookingsRes as any).data.map((b: any) => ({
					id: String(b.bookingId),
					title: b.eventName,
					venue: b.venue?.name || "Unknown Venue",
					startDate: formatDate(b.eventStart),
					endDate: formatDate(b.eventEnd),
					bookingDate: formatOnlyDate(b.createdAt),
					status: b.status as Booking["status"],
					club: b.club?.clubName || "CSEA",
					subject: b.remarks || "No description provided",
				}));
				setBookings(mapped);
			}
		} catch (err) {
			console.error("Failed to fetch bookings:", err);
		}
	};

	useEffect(() => {
		const loadData = async () => {
			await loadBookings();
			try {
				await fetchVenues("/api/bookings/venues");
			} catch (err) {
				console.error("Failed to fetch venues:", err);
			}
		};

		loadData();
	}, [getBookings, fetchVenues]);

	const venues = venuesRes?.venues || [];

	useEffect(() => {

		if (venues.length > 0 && !venue) {
			setVenue(String(venues[0].venueId));
		}
	}, [venues, venue]);

	const venueOptions =
		venues.length > 0
			? venues.map((v: any) => ({ id: String(v.venueId), label: v.name }))
			: [			
					{ id: "1", label: "SSL Lab" },
					{ id: "2", label: "NSL Lab" },
					{ id: "3", label: "Seminar Hall" },
					{ id: "4", label: "APJ Hall" },
					{ id: "5", label: "Meeting Room" },
					{ id: "6", label: "ELHC 402" },
				];
	venueOptions.unshift({ id: "0", label: "Select a venue" });
	console.log("venueOptions", venueOptions);

	const handleSubmit = async () => {
		if (!eventName || !venue || !startISO || !endISO) {
			alert(
				"Please fill in all required fields and select a date/time range from the calendar.",
			);
			return;
		}

		try {
			const selectedVenueId = parseInt(venue) || 0;
			const res: any = await addBooking("/api/bookings", {
				method: "POST",
				body: {
					venueId: selectedVenueId,
					eventName,
					eventStart: startISO,
					eventEnd: endISO,
					remarks: description || "No description provided",
				},
			});

			if (res && res.success) {
				await loadBookings();
				setEventName("");
				setDescription("");
				setSubmitCount((prev) => prev + 1);
				alert("Booking request submitted successfully.");
			}
		} catch (e: any) {
			alert(e.message || "Failed to add booking.");
		}
	};

	// Stat computations
	const approvedCount = bookings.filter((b) => b.status === "APPROVED").length;
	const pendingCount = bookings.filter((b) =>
		["PENDING_STAFF", "PENDING_FACULTY", "PENDING_COORDINATOR", "PENDING_HOD"].includes(b.status)
	).length;
	const rejectedCount = bookings.filter((b) => b.status === "REJECTED").length;

	const selectedVenueName =
		venues.find((v: any) => String(v.venueId) === venue)?.name ||
		venueOptions.find((o) => o.id === venue)?.label ||
		"Select a venue";

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-primary">
						Welcome, Club Secretary
					</h1>
					<p className="text-sm text-gray-500">
						Review and manage your booking requests
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<StatCard title="Pending requests" value={String(pendingCount)} />
				<StatCard title="Approved requests" value={String(approvedCount)} />
				<StatCard
					title="Rejected requests"
					value={String(rejectedCount)}
					variant="danger"
				/>
			</div>

			{/* My Bookings list */}
			<Card className="p-6">
				<h2 className="text-lg font-bold text-primary mb-4">
					My Booking Requests
				</h2>
				<Tabs
					tabs={[
						{ id: "all", label: "All" },
						{ id: "pending", label: "Pending" },
						{ id: "approved", label: "Approved" },
						{ id: "rejected", label: "Rejected" },
					]}
					defaultTab="all"
				>
					<TabPanelComponent id="all">
						{bookings.length === 0 ? (
							<div className="text-center py-8 text-gray-500 font-medium">
								No booking requests found.
							</div>
						) : (
							<Table
								headers={[
									"Title",
									"Venue",
									"Start date & time",
									"End date & time",
									"Booking Date",
									"Status",
								]}
							>
								{bookings.map((booking) => (
									<TableRow key={booking.id}>
										<TableCell className="font-semibold">
											{booking.title}
										</TableCell>
										<TableCell>{booking.venue}</TableCell>
										<TableCell>{booking.startDate}</TableCell>
										<TableCell>{booking.endDate}</TableCell>
										<TableCell>{booking.bookingDate}</TableCell>
										<TableCell>
											<StatusBadge status={booking.status} />
										</TableCell>
									</TableRow>
								))}
							</Table>
						)}
					</TabPanelComponent>
					<TabPanelComponent id="pending">
						{bookings.filter((b) =>
							["PENDING_STAFF", "PENDING_FACULTY", "PENDING_COORDINATOR", "PENDING_HOD"].includes(b.status)
						).length === 0 ? (
							<div className="text-center py-8 text-gray-500 font-medium">
								No pending booking requests found.
							</div>
						) : (
							<Table
								headers={[
									"Title",
									"Venue",
									"Start date & time",
									"End date & time",
									"Booking Date",
									"Status",
								]}
							>
								{bookings
									.filter((b) =>
										["PENDING_STAFF", "PENDING_FACULTY", "PENDING_COORDINATOR", "PENDING_HOD"].includes(b.status)
									)
									.map((booking) => (
										<TableRow key={booking.id}>
											<TableCell className="font-semibold">
												{booking.title}
											</TableCell>
											<TableCell>{booking.venue}</TableCell>
											<TableCell>{booking.startDate}</TableCell>
											<TableCell>{booking.endDate}</TableCell>
											<TableCell>{booking.bookingDate}</TableCell>
											<TableCell>
												<StatusBadge status={booking.status} />
											</TableCell>
										</TableRow>
									))}
							</Table>
						)}
					</TabPanelComponent>
					<TabPanelComponent id="approved">
						{bookings.filter((b) => b.status === "APPROVED").length === 0 ? (
							<div className="text-center py-8 text-gray-500 font-medium">
								No approved booking requests found.
							</div>
						) : (
							<Table
								headers={[
									"Title",
									"Venue",
									"Start date & time",
									"End date & time",
									"Booking Date",
									"Status",
								]}
							>
								{bookings
									.filter((b) => b.status === "APPROVED")
									.map((booking) => (
										<TableRow key={booking.id}>
											<TableCell className="font-semibold">
												{booking.title}
											</TableCell>
											<TableCell>{booking.venue}</TableCell>
											<TableCell>{booking.startDate}</TableCell>
											<TableCell>{booking.endDate}</TableCell>
											<TableCell>{booking.bookingDate}</TableCell>
											<TableCell>
												<StatusBadge status={booking.status} />
											</TableCell>
										</TableRow>
									))}
							</Table>
						)}
					</TabPanelComponent>
					<TabPanelComponent id="rejected">
						{bookings.filter((b) => b.status === "REJECTED").length === 0 ? (
							<div className="text-center py-8 text-gray-500 font-medium">
								No rejected booking requests found.
							</div>
						) : (
							<Table
								headers={[
									"Title",
									"Venue",
									"Start date & time",
									"End date & time",
									"Booking Date",
									"Status",
								]}
							>
								{bookings
									.filter((b) => b.status === "REJECTED")
									.map((booking) => (
										<TableRow key={booking.id}>
											<TableCell className="font-semibold">
												{booking.title}
											</TableCell>
											<TableCell>{booking.venue}</TableCell>
											<TableCell>{booking.startDate}</TableCell>
											<TableCell>{booking.endDate}</TableCell>
											<TableCell>{booking.bookingDate}</TableCell>
											<TableCell>
												<StatusBadge status={booking.status} />
											</TableCell>
										</TableRow>
									))}
							</Table>
						)}
					</TabPanelComponent>
				</Tabs>
			</Card>

			<Card className="p-6">
				<h2 className="text-base font-semibold text-accent mb-4 pb-2 border-b border-gray-100">
					New booking request
				</h2>
				<div className="space-y-4">
					{/* Inputs Row */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
						<Input
							label="Event name"
							value={eventName}
							onChange={(e) =>
								setEventName((e.target as HTMLInputElement).value)
							}
						/>
						<Select
							label="Venue"
							selectedKey={venue}
							onSelectionChange={(key) => setVenue(String(key))}
							options={venueOptions}
							className="w-full"
						/>
					</div>

					{/* Nested Venue Calendar Grid */}
					<AvailabilityGrid
						key={`${venue}-${submitCount}`}
						selectedVenue={selectedVenueName}
						selectedVenueId={venue}
						onSelectRange={(start, end, text) => {
							setStartISO(start);
							setEndISO(end);
							setSelectedRangeText(text);
						}}
					/>

					{/* Selected Date-Time display */}
					<div className="bg-card/20 border border-card-header/40 p-4 rounded-xl text-sm">
						<span className="font-semibold text-primary">
							Selected Schedule:{" "}
						</span>
						<span className="text-gray-700">{selectedRangeText}</span>
					</div>

					{/* Description & Action */}
					<div className="space-y-4">
						<TextArea
							label="Description"
							value={description}
							onChange={(e) =>
								setDescription((e.target as HTMLTextAreaElement).value)
							}
						/>
						<div className="flex justify-end mt-2">
							<Button
								variant="primary"
								onPress={handleSubmit}
								isDisabled={isLoadingAddBooking}
							>
								Submit Request
							</Button>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
