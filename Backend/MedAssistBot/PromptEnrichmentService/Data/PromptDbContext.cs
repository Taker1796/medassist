using Microsoft.EntityFrameworkCore;
using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Data;

public class PromptDbContext : DbContext
{
    public PromptDbContext(DbContextOptions<PromptDbContext> options) : base(options)
    {
    }

    public DbSet<PromptTemplate> PromptTemplates => Set<PromptTemplate>();
    public DbSet<Specialty> Specialties => Set<Specialty>();
    public DbSet<PacientCard> PacientCards => Set<PacientCard>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<PacientCardDoctor> PacientCardDoctors => Set<PacientCardDoctor>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Specialty>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Name).HasMaxLength(256);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<PromptTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TemplateText).IsRequired();
            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("NOW()");
            entity.HasIndex(e => e.SpecialtyId);
            entity.HasIndex(e => e.IsDefault);
            entity.HasOne(e => e.Specialty)
                .WithMany(s => s.PromptTemplates)
                .HasForeignKey(e => e.SpecialtyId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<PacientCard>(entity =>
        {
            entity.ToTable("pacientCards");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PatientId).HasColumnName("patientId");
            entity.Property(e => e.Summary).IsRequired().HasColumnName("summary");
            entity.Property(e => e.SpecialtyId).HasColumnName("specialtyId");
            entity.HasIndex(e => e.SpecialtyId);
            entity.HasOne(e => e.Specialty)
                .WithMany(s => s.PacientCards)
                .HasForeignKey(e => e.SpecialtyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Doctor>(entity =>
        {
            entity.ToTable("doctors");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DocorId).HasColumnName("docorId");
            entity.HasIndex(e => e.DocorId).IsUnique();
        });

        modelBuilder.Entity<PacientCardDoctor>(entity =>
        {
            entity.ToTable("pacientCardDoctors");
            entity.HasKey(e => new { e.PacientCardId, e.DoctorId });
            entity.Property(e => e.PacientCardId).HasColumnName("pacientCardId");
            entity.Property(e => e.DoctorId).HasColumnName("doctorId");
            entity.HasOne(e => e.PacientCard)
                .WithMany(p => p.PacientCardDoctors)
                .HasForeignKey(e => e.PacientCardId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Doctor)
                .WithMany(d => d.PacientCardDoctors)
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
