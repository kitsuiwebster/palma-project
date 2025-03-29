import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalmSearchComponent } from './palm-search.component';

describe('PalmSearchComponent', () => {
  let component: PalmSearchComponent;
  let fixture: ComponentFixture<PalmSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PalmSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PalmSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
