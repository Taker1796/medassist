using Microsoft.EntityFrameworkCore;
using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Data;

public class PromptDbContext : DbContext
{
    public PromptDbContext(DbContextOptions<PromptDbContext> options) : base(options)
    {
    }

    public DbSet<PromptTemplate> PromptTemplates => Set<PromptTemplate>();
    public DbSet<PacientCard> PacientCards => Set<PacientCard>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PromptTemplate>(entity =>
        {
            entity.HasKey(e => e.Code);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Text).IsRequired().HasColumnName("Text").HasColumnType("text");
            entity.Property(e => e.IsDefault).HasDefaultValue(false);
            entity.HasIndex(e => e.IsDefault);
        });

        modelBuilder.Entity<PacientCard>(entity =>
        {
            entity.ToTable("pacientCards");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PatientId).HasColumnName("patientId").HasColumnType("uuid");
            entity.Property(e => e.SpecialtyCode).IsRequired().HasMaxLength(64).HasColumnName("specialtyCode");
            entity.Property(e => e.Summary).IsRequired().HasColumnName("summary");
            entity.HasIndex(e => new { e.PatientId, e.SpecialtyCode }).IsUnique();
        });
    }
}
