using Microsoft.AspNetCore.Mvc;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Repositories;

namespace PromptEnrichmentService.Controllers;

[ApiController]
[Route("v1/patient-cards")]
[Produces("application/json")]
public class PatientCardsController : ControllerBase
{
    private readonly IPatientCardRepository _patientCardRepository;

    public PatientCardsController(IPatientCardRepository patientCardRepository)
    {
        _patientCardRepository = patientCardRepository;
    }

    [HttpPost]
    [ProducesResponseType(typeof(PatientCardResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] PatientCardUpsertRequest request, CancellationToken cancellationToken)
    {
        if (request.DoctorId <= 0)
        {
            return BadRequest("DoctorId должен быть больше 0");
        }

        if (request.PatientId <= 0)
        {
            return BadRequest("PatientId должен быть больше 0");
        }

        if (string.IsNullOrWhiteSpace(request.SpecialtyCode))
        {
            return BadRequest("SpecialtyCode обязателен");
        }

        if (string.IsNullOrWhiteSpace(request.Summary))
        {
            return BadRequest("Summary обязателен");
        }

        var created = await _patientCardRepository.CreateAsync(
            request.DoctorId,
            request.PatientId,
            request.SpecialtyCode,
            request.Summary,
            cancellationToken);

        return Created($"/v1/patient-cards/{created.Id}", ToResponse(created, request.DoctorId));
    }

    [HttpPut]
    [ProducesResponseType(typeof(PatientCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromBody] PatientCardUpsertRequest request, CancellationToken cancellationToken)
    {
        if (request.DoctorId <= 0)
        {
            return BadRequest("DoctorId должен быть больше 0");
        }

        if (request.PatientId <= 0)
        {
            return BadRequest("PatientId должен быть больше 0");
        }

        if (string.IsNullOrWhiteSpace(request.SpecialtyCode))
        {
            return BadRequest("SpecialtyCode обязателен");
        }

        if (string.IsNullOrWhiteSpace(request.Summary))
        {
            return BadRequest("Summary обязателен");
        }

        var updated = await _patientCardRepository.UpdateSummaryAsync(
            request.DoctorId,
            request.PatientId,
            request.SpecialtyCode,
            request.Summary,
            cancellationToken);

        if (updated == null)
        {
            return NotFound("Запись patient card не найдена по doctorId + specialtyCode + patientId");
        }

        return Ok(ToResponse(updated, request.DoctorId));
    }

    [HttpDelete("{patientId:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteByPatientId([FromRoute] long patientId, CancellationToken cancellationToken)
    {
        if (patientId <= 0)
        {
            return BadRequest("PatientId должен быть больше 0");
        }

        var deleted = await _patientCardRepository.DeleteByPatientIdAsync(patientId, cancellationToken);
        if (deleted == 0)
        {
            return NotFound($"Записи patient cards для patientId={patientId} не найдены");
        }

        return NoContent();
    }

    private static PatientCardResponse ToResponse(PacientCard patientCard, long doctorId)
    {
        return new PatientCardResponse
        {
            Id = patientCard.Id,
            DoctorId = doctorId,
            PatientId = patientCard.PatientId,
            SpecialtyCode = patientCard.Specialty.Code,
            Summary = patientCard.Summary
        };
    }
}
