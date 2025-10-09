using System;
using backend.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

public class AppDbContext : DbContext
{
   public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
   {
      Database.EnsureCreated();
   }

   public DbSet<Resource> Resources { get; set; }
   public DbSet<ResourceType> ResourceTypes { get; set; }
   public DbSet<Booking> Bookings { get; set; }
   public DbSet<MeetingRecording> MeetingRecordings { get; set; }

   protected override void OnModelCreating(ModelBuilder modelBuilder)
   {
      base.OnModelCreating(modelBuilder);

      modelBuilder.Entity<Booking>()
         .HasOne(b => b.Resource)
         .WithMany()
         .HasForeignKey(b => b.ResourceId);

      modelBuilder.Entity<Resource>()
         .HasOne(r => r.ResourceType)
         .WithMany()
         .HasForeignKey(r => r.ResourceTypeId);

      modelBuilder.Entity<MeetingRecording>()
         .HasOne(mr => mr.Booking)
         .WithMany()
         .HasForeignKey(mr => mr.BookingId);

      modelBuilder.Entity<ResourceType>().HasData(
         new ResourceType { Id = 1, Name = "Dropin-skrivbord" },
         new ResourceType { Id = 2, Name = "Mötesrum" },
         new ResourceType { Id = 3, Name = "VR-headset" },
         new ResourceType { Id = 4, Name = "AI-server" }
      );

      modelBuilder.Entity<Resource>().HasData(
         new Resource { Id = 1, Name = "Skrivbord 1", ResourceTypeId = 1 },
         new Resource { Id = 2, Name = "Skrivbord 2", ResourceTypeId = 1 },
         new Resource { Id = 3, Name = "Mötesrum 1", ResourceTypeId = 2 },
         new Resource { Id = 4, Name = "Mötesrum 2", ResourceTypeId = 2 },
         new Resource { Id = 5, Name = "VR-glasögon 1", ResourceTypeId = 3 },
         new Resource { Id = 6, Name = "AI-server 1", ResourceTypeId = 4 }
      );

      // Tog bort alla hårdkodade bookings med fake användar-ID
      // No initial booking data - will be created when users make bookings med riktiga Azure AD-ID och namn
   }
}
