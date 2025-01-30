attendanceSchema.pre('save', function (next) {
    if (this.checkIn && this.checkOut) {
      const duration = (this.checkOut - this.checkIn) / (1000 * 60 * 60); // Convert milliseconds to hours
      this.totalHours = Math.max(0, duration); // Ensure non-negative
      this.overtimeHours = Math.max(0, duration - 8); // Assuming 8 hours is standard work time
    }
    next();
  });
  