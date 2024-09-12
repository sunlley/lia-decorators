import { AssertParams, MethodLog } from '../dist';


class ClassA {

  @MethodLog({formater:(...args)=>{return args},showTime:true,showEnd:true})
  @AssertParams(['abc',['name','string','tom'],['age','number',12]])
  test  (params: any)  {
    console.log(params);
  }
}

const test = () => {
  new ClassA().test({ abc: 1})
}
test()