import {Component, inject, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Specialization} from '../../models/specializationModel';
import {SpecializationsService} from '../../services/specializations-service';
import {AsyncPipe, JsonPipe} from '@angular/common';

@Component({
  selector: 'app-specializations',
  imports: [
    JsonPipe,
    AsyncPipe
  ],
  templateUrl: './specializations.html',
  styleUrl: './specializations.css',
})
export class Specializations {

  specializationService: SpecializationsService = inject(SpecializationsService);
  specializations$: Observable<Specialization[]> = this.specializationService.getList();

}
