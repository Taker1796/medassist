using Microsoft.EntityFrameworkCore;
using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Data;

public class PromptDbContext : DbContext
{
    public PromptDbContext(DbContextOptions<PromptDbContext> options) : base(options)
    {
    }

    public DbSet<PromptTemplate> PromptTemplates => Set<PromptTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PromptTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SpecialtyCode);
            entity.Property(e => e.SpecialtyCode);
            entity.Property(e => e.TemplateText).IsRequired();
            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("NOW()");
        });
    }
}
