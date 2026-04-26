-- Allow renter to cancel their own bookings (update status to cancelled)
CREATE POLICY "Renter can cancel own bookings"
  ON bookings FOR UPDATE
  USING (renter_id = auth.uid())
  WITH CHECK (renter_id = auth.uid());
