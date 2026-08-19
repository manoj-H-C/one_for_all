import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProjectResponse } from '../models/project.model';
import { CurrentProjectStore } from '../state/current-project.store';

export const projectResolver: ResolveFn<ProjectResponse> = (route) => {
  const projectId = route.paramMap.get('projectId')!;
  return inject(CurrentProjectStore).load(projectId);
};
